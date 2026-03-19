import admin from 'firebase-admin';

let serviceAccount;
try {
  const base64Data = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!base64Data) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is missing");
  }
  const decodedData = Buffer.from(base64Data, 'base64').toString('utf8');
  serviceAccount = JSON.parse(decodedData);
} catch (error) {
  console.error("❌ CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT.");
  console.error("Error Detail:", error.message);
  // Fallback to empty object or skip initialization to allow server to start
  serviceAccount = null;
}

if (!admin.apps.length && serviceAccount) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin Initialized");
  } catch (err) {
    console.error("❌ Firebase Initialization Error:", err.message);
  }
} else if (!serviceAccount) {
  console.warn("⚠️ Firebase Admin NOT initialized due to missing/invalid service account.");
}

export default admin;