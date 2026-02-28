const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
require('dotenv').config();

const { authAdmin } = require('./controllers/authController');
const setupSockets = require('./sockets/socket');

const authRoutes = require('./routes/auth');
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

app.use(cors());
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

// Main Auth Route
app.post('/api/auth/login', authAdmin);

// Other Routes
app.use('/api/auth', authRoutes);
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
