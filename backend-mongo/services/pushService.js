import admin from "firebase-admin";

const firebaseAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString("utf-8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseAccount),
  });
}

export const sendPushNotification = async (token, title, body, data = {}) => {
  try {
    const message = {
      notification: { title, body },
      data,
      token,
    };
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error("Push Notification Error:", error);
    return null;
  }
};
