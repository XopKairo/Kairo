import 'dotenv/config';
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
import { createClient } from 'redis';

// Internal Modules
import { errorHandler } from './middleware/errorMiddleware.js';
import { protectAdmin } from './middleware/authMiddleware.js';
import setupSockets from './sockets/socket.js';

// Route Imports
import authRoutes from './routes/auth.js';
import userAuthRoutes from './routes/userAuth.js';
import dashboardRoutes from './routes/dashboard.js';
import walletRoutes from './routes/wallet.js';
import economyRoutes from './routes/economy.js';
import reportsRoutes from './routes/reports.js';
import monitoringRoutes from './routes/monitoring.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const server = http.createServer(app);

// Redis Client Initialization
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.on('error', (err) => console.log('Redis Client Error', err));
await redisClient.connect().catch(console.error);

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
setupSockets(io);

// Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(compression());

// Production-Safe Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
} else {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));

// Attach IO and Redis to request
app.use((req, res, next) => {
  req.io = io;
  req.redis = redisClient;
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

app.use('/api', globalLimiter);
app.use('/api/auth/login', strictLimiter);
app.use('/api/user/auth/register', strictLimiter);
app.use('/api/wallet/withdraw', strictLimiter);

// --- Routes ---

// Public / Common Auth
app.use('/api/auth', authRoutes); // Admin login, refresh
app.use('/api/user/auth', userAuthRoutes); // User Registration/OTP

// Admin Protected Routes
app.use('/api/admin/dashboard', protectAdmin, dashboardRoutes);
app.use('/api/admin/economy', protectAdmin, economyRoutes);
app.use('/api/admin/reports', protectAdmin, reportsRoutes);
app.use('/api/admin/monitoring', protectAdmin, monitoringRoutes);
app.use('/api/admin/settings', protectAdmin, settingsRoutes);

// Public Settings for Mobile App
app.use('/api/settings', settingsRoutes);

// Shared / User Routes
app.use('/api/wallet', walletRoutes);

// Health Check
app.get('/', (req, res) => {
  res.json({ message: 'Kairo Ultimate API is Live', status: 'Healthy' });
});

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Phase 5: Mongoose Connection Tuning
mongoose.connect(MONGO_URI, {
  maxPoolSize: 100,
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log('✅ MongoDB Connected with pool size 100');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ Connection Error:', err));
