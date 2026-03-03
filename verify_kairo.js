require('dotenv').config({ path: './backend-mongo/.env' });
const { admin } = require('./backend-mongo/utils/pushNotification');
const razorpay = require('./backend-mongo/utils/razorpay');
const axios = require('axios');

async function runVerification() {
    console.log('--- KAIRO PRODUCTION SCAN ---');
    let blockers = [];

    // 1. Env Check
    const required = [
        'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_PHONE', 'ADMIN_URL',
        'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'CLOUDINARY_CLOUD_NAME',
        'FIREBASE_SERVICE_ACCOUNT', 'JWT_SECRET', 'MOBILE_APP_URL',
        'MONGO_URI', 'NODE_ENV', 'PORT', 'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'ZEGO_APP_ID',
        'ZEGO_SERVER_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'
    ];

    required.forEach(v => {
        if (!process.env[v]) blockers.push(`ENV MISSING: ${v}`);
    });

    // 2. Firebase Verify
    if (admin && admin.apps.length > 0) {
        console.log('✅ Firebase initialized');
    } else {
        blockers.push('FIREBASE: Initialization failed');
    }

    // 3. Razorpay Verify
    if (razorpay) {
        console.log('✅ Razorpay initialized');
    } else {
        blockers.push('RAZORPAY: Initialization failed');
    }

    // 4. Cloudinary (Manual check of exports)
    try {
        const { getStorage } = require('./backend-mongo/config/cloudinaryConfig');
        const storage = getStorage('test');
        if (storage) console.log('✅ Cloudinary Storage ready');
    } catch (e) {
        blockers.push(`CLOUDINARY: ${e.message}`);
    }

    if (blockers.length > 0) {
        console.log('
❌ BLOCKERS FOUND:');
        blockers.forEach(b => console.log(`- ${b}`));
        process.exit(1);
    } else {
        console.log('
✅ ALL SERVICES DEPLOY-READY');
    }
}

runVerification();
