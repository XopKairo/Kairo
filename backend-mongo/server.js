import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import redisClient from './config/redis.js';

// Internal Modules
import { errorHandler } from './middleware/errorMiddleware.js';
import { checkMaintenance } from './middleware/maintenanceMiddleware.js';
import { protectAdmin } from './middleware/authMiddleware.js';
import setupSockets from './sockets/socket.js';

// Route Imports
import authRoutes from './routes/auth.js';
import interestsRoutes from './routes/interests.js';
import userAuthRoutes from './routes/userAuth.js';
import dashboardRoutes from './routes/dashboard.js';
import walletRoutes from './routes/wallet.js';
import economyRoutes from './routes/economy.js';
import reportsRoutes from './routes/reports.js';
import monitoringRoutes from './routes/monitoring.js';
import settingsRoutes from './routes/settings.js';
import chatRoutes from './routes/chat.js';
import adminUsersRoutes from './routes/users.js';
import adminHostsRoutes from './routes/hosts.js';
import adminAgenciesRoutes from './routes/agencies.js';
import adminBannersRoutes from './routes/banners.js';
import growthRoutes from './routes/growth.js';
import callRoutes from './routes/calls.js';
import paymentsRoutes from './routes/payments.js';

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { httpRequestDurationMicroseconds, getMetrics, getContentType } from './utils/monitoring.js';

const app = express();

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// Metrics middleware for latency tracking
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    httpRequestDurationMicroseconds.labels(req.method, route, res.statusCode).observe(duration);
  });
  next();
});

const server = http.createServer(app);

// Socket.io initialization
const allowedOrigins = [
  'https://kairo-sooty.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Phase 6: Socket.io Redis Adapter for Scalability
try {
  const subClient = redisClient.duplicate();
  await subClient.connect();
  io.adapter(createAdapter(redisClient, subClient));
  console.log('✅ Socket.io Redis Adapter connected');
} catch (err) {
  console.error('⚠️ Socket.io Redis Adapter failed. Running in single-server mode.', err.message);
}

setupSockets(io);

// Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Robust CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());

// Production-Safe Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
} else {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));

// Maintenance Mode Middleware
app.use(checkMaintenance);

// Attach IO to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Phase 4: Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests from this IP' }
});

const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: { success: false, message: 'Too many requests. Please wait a minute.' }
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 requests per 5 minutes
  message: { success: false, message: 'Too many OTP requests. Please wait 5 minutes.' }
});

app.use('/api', globalLimiter);
app.use('/api/auth/login', strictLimiter);
app.use('/api/user/auth/register', strictLimiter);
app.use('/api/user/auth/send-otp', otpLimiter);
app.use('/api/wallet/withdraw', strictLimiter);

// --- Routes ---

// Public / Common Auth
app.use('/api/auth', authRoutes);
app.use('/api/interests', interestsRoutes); // Admin login, refresh
app.use('/api/user/auth', userAuthRoutes); // User Registration/OTP
app.use('/api/user/payments', paymentsRoutes); // Payment Routes

// Admin Protected Routes
app.use('/api/admin/dashboard', protectAdmin, dashboardRoutes);
app.use('/api/admin/economy', protectAdmin, economyRoutes);
app.use('/api/admin/reports', protectAdmin, reportsRoutes);
app.use('/api/admin/monitoring', protectAdmin, monitoringRoutes);
app.use('/api/admin/settings', protectAdmin, settingsRoutes);
app.use('/api/admin/users', protectAdmin, adminUsersRoutes);
app.use('/api/users', adminUsersRoutes);
app.use('/api/admin/hosts', protectAdmin, adminHostsRoutes);
app.use('/api/admin/agencies', protectAdmin, adminAgenciesRoutes);
app.use('/api/admin/banners', protectAdmin, adminBannersRoutes);

// Public Settings for Mobile App
app.use('/api/settings', settingsRoutes);

// Shared / User Routes
app.use('/api/wallet', walletRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/growth', growthRoutes);
app.use('/api/calls', callRoutes);

// Monitoring / Metrics Endpoint
app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', getContentType());
    res.send(metrics);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Health Check Endpoint (Robust Debugging)
app.get('/api/health', async (req, res) => {
  try {
    const adminCount = await mongoose.model('Admin').countDocuments();
    res.json({
      status: 'ok',
      message: 'Kairo API is running',
      environment: process.env.NODE_ENV,
      adminSeeded: adminCount > 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: error.message });
  }
});

// Root fallback Health Check
app.get('/', (req, res) => {
  res.json({ message: 'Kairo Ultimate API is Live', status: 'Healthy' });
});

// Sentry error handler must be before any other error middleware
Sentry.setupExpressErrorHandler(app);

// Error Handling
app.use(errorHandler);

import { seedAdmin } from './utils/initDb.js';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Global Exception & Rejection Handlers
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...', err.message);
  Sentry.captureException(err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...', err.message);
  Sentry.captureException(err);
  // Graceful shutdown: wait for pending requests to finish
  server.close(() => process.exit(1));
});

// Phase 5: Mongoose Connection Tuning
mongoose.connect(MONGO_URI, {
  maxPoolSize: 100,
  serverSelectionTimeoutMS: 5000
})
  .then(async () => {
    console.log('✅ MongoDB Connected with pool size 100');
    await seedAdmin(); // Auto-seed admin user
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ Connection Error:', err));
