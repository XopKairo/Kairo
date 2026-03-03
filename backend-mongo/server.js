require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const { errorHandler } = require('./middleware/errorMiddleware');
const { protectUser, protectAdmin } = require('./middleware/authMiddleware');
const { authAdmin, verifyLoginOTP } = require('./controllers/authController');
const setupSockets = require('./sockets/socket');

// Route Imports
const authRoutes = require('./routes/auth');
const userAuthRoutes = require('./routes/userAuth');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');
const userRoutes = require('./routes/users');
const hostRoutes = require('./routes/hosts');
const economyRoutes = require('./routes/economy');
const callRoutes = require('./routes/calls');
const payoutRoutes = require('./routes/payouts');
const marketingRoutes = require('./routes/marketing');
const monitoringRoutes = require('./routes/monitoring');
const walletRoutes = require('./routes/wallet');
const verificationRoutes = require('./routes/verification');
const interestRoutes = require('./routes/interests');
const chatRoutes = require('./routes/chat');
const postRoutes = require('./routes/posts');
const notificationRoutes = require('./routes/notifications');
const agencyRoutes = require('./routes/agencies');
const ticketRoutes = require('./routes/tickets');
const reportRoutes = require('./routes/reports');
const paymentRoutes = require('./routes/payments');

// STRICT SECURITY CHECK: Validate required environment variables
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_PHONE',
  'ADMIN_PASSWORD',
  'ZEGO_APP_ID',
  'ZEGO_SERVER_SECRET',
  'FIREBASE_SERVICE_ACCOUNT',
  'CASHFREE_APP_ID',
  'CASHFREE_SECRET_KEY',
  'CASHFREE_ENDPOINT'
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`CRITICAL ERROR: Environment variable ${varName} is missing.`);
    process.exit(1);
  }
});

const app = express();
const server = http.createServer(app);
const io = setupSockets(server); // initialize socket.io

// HTTPS Enforcement Middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
});

// Security Middleware
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());
app.use(morgan('combined'));

// Body parser with limit
app.use(express.json({ limit: '10mb' }));

// Rate Limiting
const genericLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many admin login attempts, please try again after 15 minutes' },
});

app.use('/api/', genericLimiter);
app.use('/api/admin/login', adminLoginLimiter);

// CORS configuration - Reject all unknown origins
const allowedOrigins = [
  process.env.ADMIN_URL,
  process.env.MOBILE_APP_URL,
  'https://kairo-sooty.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      console.warn(`Blocked CORS request from origin: ${origin}`);
      return callback(new Error('Origin not allowed by CORS'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

// Root Route
app.get('/', (req, res) => {
  res.send('Kairo API is running successfully!');
});

// Expose io object to routes if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public Auth Routes
app.post('/api/admin/login', authAdmin);
app.post('/api/admin/verify-otp', verifyLoginOTP);
app.use('/api/user/auth', userAuthRoutes);

// --- ADMIN ROUTES (Protected by protectAdmin) ---
const adminBase = '/api/admin';
app.use(`${adminBase}/dashboard`, protectAdmin, dashboardRoutes);
app.use(`${adminBase}/settings`, protectAdmin, settingsRoutes);
app.use(`${adminBase}/users`, protectAdmin, userRoutes);
app.use(`${adminBase}/notifications`, protectAdmin, notificationRoutes);
app.use(`${adminBase}/wallet`, protectAdmin, walletRoutes);
app.use(`${adminBase}/marketing`, protectAdmin, marketingRoutes);
app.use(`${adminBase}/monitoring`, protectAdmin, monitoringRoutes);
app.use(`${adminBase}/verification`, protectAdmin, verificationRoutes);
app.use(`${adminBase}/payouts`, protectAdmin, payoutRoutes);
app.use(`${adminBase}/reports`, protectAdmin, reportRoutes);
app.use(`${adminBase}/tickets`, protectAdmin, ticketRoutes);
app.use(`${adminBase}/interests`, protectAdmin, interestRoutes);
app.use(`${adminBase}/posts`, protectAdmin, postRoutes);
app.use(`${adminBase}/chat`, protectAdmin, chatRoutes);
app.use(`${adminBase}/calls`, protectAdmin, callRoutes);
app.use(`${adminBase}/economy`, protectAdmin, economyRoutes);
app.use(`${adminBase}/hosts`, protectAdmin, hostRoutes);

// --- USER ROUTES (Protected by protectUser) ---
const userBase = '/api/user';
app.use(`${userBase}/dashboard`, protectUser, dashboardRoutes);
app.use(`${userBase}/settings`, protectUser, settingsRoutes);
app.use(`${userBase}/users`, protectUser, userRoutes);
app.use(`${userBase}/hosts`, protectUser, hostRoutes);
app.use(`${userBase}/economy`, protectUser, economyRoutes);
app.use(`${userBase}/calls`, protectUser, callRoutes);
app.use(`${userBase}/wallet`, protectUser, walletRoutes);
app.use(`${userBase}/interests`, protectUser, interestRoutes);
app.use(`${userBase}/chat`, protectUser, chatRoutes);
app.use(`${userBase}/posts`, protectUser, postRoutes);
app.use(`${userBase}/notifications`, protectUser, notificationRoutes);
app.use(`${userBase}/agencies`, protectUser, agencyRoutes);
app.use(`${userBase}/tickets`, protectUser, ticketRoutes);
app.use(`${userBase}/reports`, protectUser, reportRoutes);
app.use(`${userBase}/payments`, protectUser, paymentRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const ensureAdmin = async () => {
  try {
    const Admin = require('./models/Admin');
    const email = process.env.ADMIN_EMAIL;
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD;
    const phone = process.env.ADMIN_PHONE;

    let admin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (!admin) {
      console.log(`[DB] Admin not found. Creating admin: ${username}`);
      admin = new Admin({ username, email, password, phone, role: 'admin' });
      await admin.save();
      console.log('[DB] Admin Created Successfully');
    } else {
      let modified = false;
      if (!admin.username) { admin.username = username; modified = true; }
      if (admin.role !== 'admin') { admin.role = 'admin'; modified = true; }
      if (modified) {
        await admin.save();
        console.log('[DB] Admin record updated');
      }
    }
  } catch (err) {
    console.error('[DB] Admin Check Error:', err.message);
  }
};

const connectDB = async (retryCount = 5) => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully');
    await ensureAdmin();
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error(`MongoDB connection error (retries left ${retryCount}):`, err);
    if (retryCount > 0) {
      setTimeout(() => connectDB(retryCount - 1), 5000);
    } else {
      process.exit(1);
    }
  }
};

connectDB();
