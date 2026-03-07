import admin from 'firebase-admin';

// Initialize Firebase Admin with FIREBASE_SERVICE_ACCOUNT env var
let serviceAccount;
let rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

if (rawEnv) {
  try {
    // 1. Basic cleanup
    let current = rawEnv.trim().replace(/^["']|["']$/g, '');
    
    // 2. Base64 Decode if necessary (handles multiple layers)
    let attempts = 0;
    while (attempts < 3 && !current.startsWith('{')) {
        let decoded = Buffer.from(current, 'base64').toString('utf8');
        if (decoded === current) break;
        current = decoded.trim();
        attempts++;
    }

    // 3. Robust JSON Parse with manual multi-line fix for private_key
    try {
        serviceAccount = JSON.parse(current);
    } catch (e) {
        // Fix literal newlines in private_key field
        const fixed = current.replace(/"private_key"\s*:\s*"(.*?)"/s, (match, pk) => {
            return `"private_key": "${pk.replace(/\n/g, '\\n').replace(/\r/g, '')}"`;
        });
        serviceAccount = JSON.parse(fixed);
    }

    if (serviceAccount && serviceAccount.private_key) {
        // PEM must have \n but NO SPACES within the key body
        let pk = serviceAccount.private_key
            .replace(/\\n/g, '\n')
            .replace(/\r/g, '')
            .trim();
        
        // Extract headers
        const header = '-----BEGIN PRIVATE KEY-----';
        const footer = '-----END PRIVATE KEY-----';
        
        if (pk.includes(header) && pk.includes(footer)) {
            const body = pk.split(header)[1].split(footer)[0].replace(/\s+/g, '');
            // Wrap body to 64 chars per line (standard PEM)
            const wrappedBody = body.match(/.{1,64}/g).join('\n');
            pk = `${header}\n${wrappedBody}\n${footer}`;
        }
        
        serviceAccount.private_key = pk;
    }

  } catch (error) {
    console.error('CRITICAL ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT:', error.message);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
} else if (process.env.NODE_ENV === 'production') {
  console.error('CRITICAL ERROR: FIREBASE_SERVICE_ACCOUNT is missing in production.');
  process.exit(1);
}

if (serviceAccount && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized successfully.');
  } catch (certError) {
    console.error('❌ Firebase Cert Error:', certError.message);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
}

export const firebaseAdmin = admin;

export const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken) return;
  const message = { notification: { title, body }, data, token: pushToken };
  try {
    return await admin.messaging().send(message);
  } catch (error) {
    console.error('Push Error:', error.message);
  }
};

export default admin;
