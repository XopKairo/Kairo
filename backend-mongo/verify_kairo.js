process.chdir(__dirname);
require('dotenv').config();
const { admin } = require('./utils/pushNotification');

async function runVerification() {
    console.log('--- KAIRO PRODUCTION SCAN ---');
    let blockers = [];

    const required = [
        'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_PHONE', 'ADMIN_URL',
        'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'CLOUDINARY_CLOUD_NAME',
        'FIREBASE_SERVICE_ACCOUNT', 'JWT_SECRET', 'MOBILE_APP_URL',
        'MONGO_URI', 'NODE_ENV', 'PORT', 'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'ZEGO_APP_ID',
        'ZEGO_SERVER_SECRET',
        'CASHFREE_APP_ID', 'CASHFREE_SECRET_KEY', 'CASHFREE_ENDPOINT'
    ];

    required.forEach(v => {
        if (!process.env[v]) blockers.push(`ENV MISSING: ${v}`);
    });

    if (admin && admin.apps && admin.apps.length > 0) {
        console.log('✅ Firebase initialized');
    } else {
        blockers.push('FIREBASE: Initialization failed');
    }

    // Cashfree check
    if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
        console.log('✅ Cashfree configuration verified');
    } else {
        blockers.push('CASHFREE: Configuration missing');
    }

    try {
        const { getStorage } = require('./config/cloudinaryConfig');
        const storage = getStorage('test');
        if (storage) console.log('✅ Cloudinary Storage ready');
    } catch (e) {
        blockers.push(`CLOUDINARY: ${e.message}`);
    }

    if (blockers.length > 0) {
        console.log('\n❌ BLOCKERS FOUND:');
        blockers.forEach(b => console.log(`- ${b}`));
        process.exit(1);
    } else {
        console.log('\n✅ ALL SERVICES DEPLOY-READY');
    }
}

runVerification();
