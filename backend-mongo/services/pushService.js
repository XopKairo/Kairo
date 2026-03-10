import admin from "firebase-admin";

// Initialize Firebase Admin with FIREBASE_SERVICE_ACCOUNT env var
let serviceAccount;
let rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

if (rawEnv) {
  try {
    let current = rawEnv.trim().replace(/^["']|["']$/g, "");
    
    // Auto-decode base64 if necessary
    if (!current.startsWith("{")) {
      current = Buffer.from(current, "base64").toString("utf8");
    }

    try {
      serviceAccount = JSON.parse(current);
    } catch {
      // Fix literal newlines in private_key field often seen in env vars
      const fixed = current.replace(
        /"private_key"\s*:\s*"(.*?)"/s,
        (match, pk) => {
          return `"private_key": "${pk.replace(/\n/g, "\\n").replace(/\r/g, "")}"`;
        },
      );
      serviceAccount = JSON.parse(fixed);
    }

    if (serviceAccount && serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }
  } catch (error) {
    console.error("Firebase Auth Parse Error:", error.message);
  }
}

if (serviceAccount && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin active");
  } catch (err) {
    console.error("Firebase Init Error:", err.message);
  }
}

export const sendPushNotification = async (token, title, body, data = {}) => {
  if (!token || !admin.apps.length) return null;
  try {
    const message = {
      notification: { title, body },
      data,
      token,
    };
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error("Push Notification Error:", error.message);
    return null;
  }
};

export default admin;
