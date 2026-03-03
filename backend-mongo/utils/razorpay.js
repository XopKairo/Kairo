const Razorpay = require('razorpay');
require('dotenv').config();

let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else if (process.env.NODE_ENV === 'production') {
  throw new Error('CRITICAL ERROR: Razorpay keys missing in environment variables. Payments will not work in production.');
} else {
  console.warn('Razorpay keys missing in environment variables. Payments will not work.');
}

module.exports = razorpay;
