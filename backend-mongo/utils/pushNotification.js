const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/**
 * Send a push notification to a specific user
 * @param {string} pushToken - The target device's Expo push token or FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Extra data for the app
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken) {
    console.log('No push token provided, skipping notification');
    return;
  }

  const message = {
    notification: {
      title,
      body,
    },
    data,
    token: pushToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

module.exports = { admin, sendPushNotification };
