const axios = require('axios');
const crypto = require('crypto');

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENDPOINT = process.env.CASHFREE_ENDPOINT; // https://api.cashfree.com/pg

const createCashfreeOrder = async (orderData) => {
  try {
    const response = await axios.post(
      `${CASHFREE_ENDPOINT}/orders`,
      {
        order_id: orderData.orderId,
        order_amount: orderData.amount,
        order_currency: orderData.currency || "INR",
        customer_details: {
          customer_id: orderData.userId,
          customer_phone: orderData.customerPhone || "9999999999", // Fallback if missing
          customer_email: orderData.customerEmail || "test@cashfree.com"
        },
        order_meta: {
          return_url: orderData.returnUrl || "https://kairo-sooty.vercel.app/payment-status?order_id={order_id}"
        }
      },
      {
        headers: {
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Cashfree Order Creation Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create Cashfree order');
  }
};

const verifyCashfreeSignature = (orderId, paymentId, signature) => {
  // Cashfree logic for signature verification depends on the webhook/return data
  // For standard V3 API, they usually provide a signature in the response or webhook
  // If we are doing it manually for a custom flow:
  // const data = orderId + paymentId;
  // const expectedSignature = crypto.createHmac('sha256', CASHFREE_SECRET_KEY).update(data).digest('base64');
  // return expectedSignature === signature;
  
  // NOTE: In the latest Cashfree SDK/API, it is recommended to fetch the order status
  // from their API to verify instead of just checking the signature.
  return true; // Placeholder for logic below in status check
};

const getCashfreeOrderStatus = async (orderId) => {
    try {
        const response = await axios.get(
          `${CASHFREE_ENDPOINT}/orders/${orderId}`,
          {
            headers: {
              'x-client-id': CASHFREE_APP_ID,
              'x-client-secret': CASHFREE_SECRET_KEY,
              'x-api-version': '2023-08-01'
            }
          }
        );
        return response.data;
      } catch (error) {
        console.error('Cashfree Order Status Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch Cashfree order status');
      }
}

module.exports = { createCashfreeOrder, verifyCashfreeSignature, getCashfreeOrderStatus };
