const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorMiddleware');
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

const app = express();
const server = http.createServer(app);
const io = setupSockets(server); // initialize socket.io

// Security Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Rate Limiting
const genericLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many OTP requests from this IP, please try again after 15 minutes' },
});

app.use('/api/', genericLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/user/auth/login', authLimiter);
app.use('/api/admin/verify-otp', otpLimiter);
app.use('/api/user/auth/request-otp', otpLimiter);

// CORS configuration for Vercel and local development
app.use(cors({
  origin: [
    /https:\/\/.*\.vercel\.app$/,
    'https://kairo-admin.vercel.app',
    'https://kairo-sooty.vercel.app',
    process.env.ADMIN_URL,
    process.env.MOBILE_APP_URL
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

app.use(express.json());

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

// Main Auth Routes (Direct)
app.post('/api/auth/login', authAdmin);
app.post('/api/admin/login', authAdmin);
app.post('/api/admin/verify-otp', verifyLoginOTP);

// Authentication Routes
app.use('/api/auth', authRoutes);
app.use('/api/user/auth', userAuthRoutes);

// Admin Routes Alias (to match frontend expectations)
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/notifications', notificationRoutes);

// Standard Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hosts', hostRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reports', reportRoutes);

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
    console.log(`[DB] Admin model is using collection: ${Admin.collection.name}`);
    const count = await Admin.countDocuments();
    console.log(`[DB] Current Admin count: ${count}`);

    const email = process.env.ADMIN_EMAIL || 'omalloorajil@gmail.com';
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'adminpassword123';
    const phone = process.env.ADMIN_PHONE || '+917356704978';

    let admin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (!admin) {
      console.log(`[DB] Admin not found. Creating default admin: ${username}`);
      admin = new Admin({ username, email, password, phone, role: 'admin' });
      await admin.save();
      console.log('[DB] Default Admin Created Successfully');
    } else {
      console.log(`[DB] Admin record found: ${admin.username} (${admin.email})`);
      let modified = false;
      if (!admin.username) { admin.username = username; modified = true; }
      if (admin.role !== 'admin') { admin.role = 'admin'; modified = true; }

      if (modified) {
        await admin.save();
        console.log('[DB] Admin record updated with missing username or role');
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
