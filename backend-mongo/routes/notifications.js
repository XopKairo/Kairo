const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const path = require('path');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Initialize Firebase Admin
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));
  }
} catch (error) {
  console.error('Firebase service account error:', error.message);
}

if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// GET all notifications (Admin)
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({}).sort({ sentAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST send new push notification
router.post('/', async (req, res) => {
  try {
    const { title, message, targetAudience, type } = req.body;

    const notification = new Notification({
      title,
      message,
      targetAudience,
      type
    });

    await notification.save();

    // Fetch all users with a valid pushToken
    const users = await User.find({ pushToken: { $ne: '' } }).select('pushToken');
    const tokens = users.map(user => user.pushToken);

    let successCount = 0;
    let failureCount = 0;

    if (tokens.length > 0) {
      const payload = {
        notification: {
          title: title,
          body: message,
        },
        // You can add data payload for app logic
        data: {
          type: type || 'Info',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        }
      };

      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens: tokens,
          notification: payload.notification,
          data: payload.data
        });

        successCount = response.successCount;
        failureCount = response.failureCount;
        console.log(`${successCount} messages were sent successfully`);
      } catch (fcmError) {
        console.error('Error sending FCM multicast:', fcmError);
      }
    }

    res.status(201).json({ 
      message: 'Notification processed', 
      tokenCount: tokens.length,
      successCount,
      failureCount,
      notification 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

module.exports = router;