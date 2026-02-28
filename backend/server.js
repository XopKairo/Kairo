#!/bin/bash

echo "--- Kairo Admin Panel Full Reset & Rebuild ---"

# 1. Kill all existing Node.js processes
echo "Killing any running Node.js processes..."
pkill -f node || true # Ignore if no process is found

# 2. Remove existing Kairo project directory
echo "Removing existing Kairo project directory..."
rm -rf Kairo

# 3. Re-extract the original zip file
echo "Extracting original admin template..."
unzip berry-vue-1.0.0.zip -d Kairo || { echo "Error: berry-vue-1.0.0.zip not found. Please ensure it's in the home directory."; exit 1; }

# 4. Rename and restructure to Kairo/admin
echo "Restructuring project directory to Kairo/admin..."
mv Kairo/berry-vue-1.0.0 Kairo/admin

# 5. Create backend directory and initialize
echo "Setting up backend directory..."
mkdir -p Kairo/backend
cd Kairo/backend
npm init -y --silent

# 6. Install backend dependencies
echo "Installing backend dependencies (express, cors, body-parser, fs, path, http, socket.io, multer)..."
npm install express cors body-parser socket.io multer --silent || { echo "Error: Failed to install backend dependencies."; exit 1; }

# 7. Write full backend server.js code
echo "Writing full backend server.js..."
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files

const DB_PATH = path.join(__dirname, 'database.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const HOST_ID_DIR = path.join(UPLOADS_DIR, 'host_ids');

// Ensure upload directories exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(HOST_ID_DIR)) fs.mkdirSync(HOST_ID_DIR);

// Multer storage config for host ID uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, HOST_ID_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `host_id-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });


// --- DATABASE UTILITIES ---
const getDB = () => {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    // If database.json doesn't exist or is corrupted, create it with initial data
    const initialData = {
      users: [{ id: 1, name: "Rahul Sharma", email: "rahul@test.com", coins: 1500, status: "Active", ip: "103.24.1.5" }],
      hosts: [
        { id: 101, name: "Maya Angel", status: "Online", earnings: 1200, rating: 4.8, is_verified: 1, doc_path: "" },
        { id: 102, name: "Zara Khan", status: "Busy", earnings: 850, rating: 4.5, is_verified: 0, doc_path: "" }
      ],
      agencies: [{ id: 1, name: "Global Talents", owner: "John Doe", commission: 10 }],
      coinPackages: [
        { id: 1, name: "Starter Pack", coins: 100, price: 4.99, bonus: 10 },
        { id: 2, name: "VIP Legend", coins: 5000, price: 149.99, bonus: 1500 }
      ],
      gifts: [
        { id: 1, name: "Rose", price: 10, category: "Basic", status: "Active" }
      ],
      banners: [
        { id: 1, title: "Welcome Offer", status: "Active", image: "https://via.placeholder.com/400x200?text=Kairo+Banner+1" }
      ],
      calls: [
        { id: 1, user_id: 1, host_id: 101, duration: 300, start_time: Date.now() - 3600000, end_time: Date.now() - 3500000 }
      ],
      tickets: [
        { id: 1, user_id: 1, subject: "Payment Failed", status: "Open", created_at: Date.now() }
      ],
      payouts: [
        { id: 1, host_id: 101, amount: 100, status: "Pending", created_at: Date.now() }
      ],
      reports: [
        { id: 1, reporter_id: 1, reported_id: 102, reason: "Inappropriate Behavior", status: "Open", created_at: Date.now() }
      ],
      notifications: [],
      settings: {
        app: { callRate: 50, commission: 70, maintenance: false },
        ads: { rewardPerAd: 5, dailyLimit: 10, script: "" },
        admin: { email: "omalloorajil@gmail.com", password: "Ajil2255@@#", name: "Omalloor Ajil", role: "Project Admin", dndMode: false, allowNotifications: true, social: {} }
      }
    };
    console.warn("database.json not found or corrupted. Creating a new one with initial data.");
    saveDB(initialData);
    return initialData;
  }
};

const saveDB = (db) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("Error writing to database.json:", e.message);
  }
};

// --- REAL-TIME NOTIFICATIONS (SOCKET.IO) ---
const sendNotification = (title, message) => {
  const db = getDB();
  const newNotif = { id: Date.now(), title, message, read: false, date: new Date().toISOString() };
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift(newNotif); // Add to beginning
  saveDB(db);
  io.emit('new-notification', newNotif); // Push to all connected clients
};

// --- AUTH & ADMIN APIS ---
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const db = getDB();
  if (db.settings.admin.email === email && db.settings.admin.password === password) {
    res.json({ success: true, user: { email, role: 'admin' } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid Credentials' });
  }
});

app.post('/api/admin/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  const db = getDB();
  if (db.settings.admin.email === email) {
    db.settings.admin.password = newPassword;
    saveDB(db);
    res.json({ success: true, message: 'Password reset successful' });
  } else {
    res.status(404).json({ success: false, message: 'Email not found' });
  }
});

app.get('/api/admin/profile', (req, res) => {
  const db = getDB();
  res.json({
    name: db.settings.admin.name || "Omalloor Ajil",
    role: db.settings.admin.role || "Project Admin",
    email: db.settings.admin.email,
    dndMode: db.settings.admin.dndMode || false,
    allowNotifications: db.settings.admin.allowNotifications !== undefined ? db.settings.admin.allowNotifications : true
  });
});

app.post('/api/admin/profile/settings', (req, res) => {
  const db = getDB();
  db.settings.admin = { ...db.settings.admin, ...req.body };
  saveDB(db);
  res.json({ success: true });
});

app.post('/api/admin/account/update', (req, res) => {
  const { name, email, newPassword } = req.body;
  const db = getDB();
  if (name) db.settings.admin.name = name;
  if (email) db.settings.admin.email = email;
  if (newPassword) db.settings.admin.password = newPassword; // In real app, hash password
  saveDB(db);
  res.json({ success: true, message: "Account Updated Successfully" });
});

app.get('/api/admin/social-profile', (req, res) => {
  const db = getDB();
  res.json(db.settings.admin.social || {});
});

app.post('/api/admin/social-profile', (req, res) => {
  const db = getDB();
  db.settings.admin.social = { ...db.settings.admin.social, ...req.body };
  saveDB(db);
  res.json({ success: true, message: "Social Profile Updated" });
});

// --- SETTINGS CONTROLLER ---
app.get('/api/admin/settings/:key', (req, res) => {
  const db = getDB();
  res.json(db.settings[req.params.key] || {});
});

app.post('/api/admin/settings/:key', (req, res) => {
  const db = getDB();
  db.settings[req.params.key] = { ...db.settings[req.params.key], ...req.body };
  saveDB(db);
  res.json({ success: true });
});

// --- DASHBOARD ANALYTICS ---
app.get('/api/admin/analytics', (req, res) => {
  const d = getDB();
  res.json({
    totalUsers: d.users.length,
    totalCoins: d.users.reduce((acc, u) => acc + (u.coins || 0), 0),
    activeHosts: d.hosts.filter(h => h.is_verified && h.status === 'Online').length,
    pendingPayouts: d.payouts.filter(p => p.status === 'Pending').length,
    openTickets: d.tickets.filter(t => t.status === 'Open').length
  });
});

// --- UNIVERSAL CRUD ---
app.get('/api/:collection', (req, res) => {
  res.json(getDB()[req.params.collection] || []);
});

app.post('/api/:collection', (req, res) => {
  const db = getDB();
  const newItem = { id: Date.now(), ...req.body };
  if (!db[req.params.collection]) db[req.params.collection] = [];
  db[req.params.collection].push(newItem);
  saveDB(db);
  res.json(newItem);
});

app.put('/api/:collection/:id', (req, res) => {
  const db = getDB();
  const idx = db[req.params.collection].findIndex(i => i.id == req.params.id);
  if (idx !== -1) {
    db[req.params.collection][idx] = { ...db[req.params.collection][idx], ...req.body };
    saveDB(db);
    res.json({ success: true });
  } else res.status(404).send("Not found");
});

app.delete('/api/:collection/:id', (req, res) => {
  const db = getDB();
  db[req.params.collection] = db[req.params.collection].filter(i => i.id != req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// --- SPECIFIC ACTIONS ---
app.put('/api/hosts/:id/verify', (req, res) => {
  const db = getDB();
  const host = db.hosts.find(h => h.id == req.params.id);
  if (host) {
    host.is_verified = 1;
    saveDB(db);
    res.json({ success: true });
  } else res.status(404).send("Host not found");
});

app.put('/api/tickets/:id/resolve', (req, res) => {
  const db = getDB();
  const ticket = db.tickets.find(t => t.id == req.params.id);
  if (ticket) {
    ticket.status = 'Resolved';
    saveDB(db);
    res.json({ success: true });
  } else res.status(404).send("Ticket not found");
});

app.put('/api/payouts/:id/status', (req, res) => {
  const { status } = req.body;
  const db = getDB();
  const payout = db.payouts.find(p => p.id == req.params.id);
  if (payout) {
    payout.status = status;
    saveDB(db);
    res.json({ success: true });
  } else res.status(404).send("Payout not found");
});

app.put('/api/admin/notifications/:id/dismiss', (req, res) => {
  const db = getDB();
  const idx = db.notifications.findIndex(n => n.id == req.params.id);
  if (idx !== -1) {
    db.notifications.splice(idx, 1); // Remove notification
    saveDB(db);
    res.json({ success: true });
  } else res.status(404).send("Notification not found");
});

// Test Notification Route (for pushing live notifications)
app.get('/api/admin/test-notif', (req, res) => {
  sendNotification("Test Notification", "This is a test notification from backend!");
  res.json({ success: true, message: "Notification triggered!" });
});


const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Kairo Server Active on Port ${PORT}`));
