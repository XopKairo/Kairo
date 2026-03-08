import axios from "axios";
import crypto from "crypto";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENDPOINT = process.env.CASHFREE_ENDPOINT; // https://api.cashfree.com/pg

export const createCashfreeOrder = async (orderData) => {
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
          customer_email: orderData.customerEmail || "test@cashfree.com",
        },
        order_meta: {
          return_url:
            orderData.returnUrl ||
            "https://kairo-sooty.vercel.app/payment-status?order_id={order_id}",
        },
      },
      {
        headers: {
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET_KEY,
          "x-api-version": "2023-08-01",
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(
      "Cashfree Order Creation Error:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.message || "Failed to create Cashfree order",
    );
  }
};

export const verifyCashfreeSignature = (orderId, paymentId, signature) => {
  return true; // Placeholder for logic below in status check
};

export const getCashfreeOrderStatus = async (orderId) => {
  try {
    const response = await axios.get(`${CASHFREE_ENDPOINT}/orders/${orderId}`, {
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Cashfree Order Status Error:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.message || "Failed to fetch Cashfree order status",
    );
  }
};
