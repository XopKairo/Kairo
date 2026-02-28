const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
require('dotenv').config();

const { authAdmin } = require('./controllers/authController');
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

const app = express();
const server = http.createServer(app);
const io = setupSockets(server); // initialize socket.io

// CORS configuration for Vercel and local development
app.use(cors({
  origin: '*', // Allow all for now, or specify: ['https://kairo-admin.vercel.app', 'http://localhost:5173']
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

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
