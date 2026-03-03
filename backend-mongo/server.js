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
require('dotenv').config();

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

const app = express();
const server = http.createServer(app);
const io = setupSockets(server); // initialize socket.io

// Security Middleware
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Sanitize data
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution
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

// CORS configuration
const allowedOrigins = [
  process.env.ADMIN_URL,
  process.env.MOBILE_APP_URL,
  'https://kairo-sooty.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
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

// Admin Routes (Protected)
app.use('/api/admin/dashboard', protectAdmin, dashboardRoutes);
app.use('/api/admin/settings', protectAdmin, settingsRoutes);
app.use('/api/admin/users', protectAdmin, userRoutes);
app.use('/api/admin/notifications', protectAdmin, notificationRoutes);
app.use('/api/admin/wallet', protectAdmin, walletRoutes);

// Standard Routes (User Protected)
app.use('/api/dashboard', protectUser, dashboardRoutes);
app.use('/api/settings', protectUser, settingsRoutes);
app.use('/api/users', protectUser, userRoutes);
app.use('/api/hosts', protectUser, hostRoutes);
app.use('/api/economy', protectUser, economyRoutes);
app.use('/api/calls', protectUser, callRoutes);
app.use('/api/payouts', protectUser, payoutRoutes);
app.use('/api/marketing', protectUser, marketingRoutes);
app.use('/api/monitoring', protectUser, monitoringRoutes);
app.use('/api/wallet', protectUser, walletRoutes);
app.use('/api/verification', protectUser, verificationRoutes);
app.use('/api/interests', protectUser, interestRoutes);
app.use('/api/chat', protectUser, chatRoutes);
app.use('/api/posts', protectUser, postRoutes);
app.use('/api/notifications', protectUser, notificationRoutes);
app.use('/api/agencies', protectUser, agencyRoutes);
app.use('/api/tickets', protectUser, ticketRoutes);
app.use('/api/reports', protectUser, reportRoutes);

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
    console.log('--- Environment Configuration ---');
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`MONGO_URI: ${process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : 'MISSING'}`);
    console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'DEFINED' : 'MISSING'}`);
    console.log(`PORT: ${process.env.PORT || 5000}`);
    console.log(`APP_MODE: ${process.env.APP_MODE || 'Not set'}`);
    console.log('---------------------------------');

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
