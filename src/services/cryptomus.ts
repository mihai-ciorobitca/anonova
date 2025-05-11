import axios from 'axios';

const CRYPTOMUS_API_URL = 'https://api.cryptomus.com/v1';
const API_KEY = process.env.CRYPTOMUS_API_KEY;
const MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID;

if (!API_KEY || !MERCHANT_ID) {
  throw new Error('Cryptomus API key or Merchant ID is not set in environment variables.');
}

const cryptomusClient = axios.create({
  baseURL: CRYPTOMUS_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  },
});

export const createPayment = async (amount: number, currency: string, orderId: string, callbackUrl: string) => {
  try {
    const response = await cryptomusClient.post('/payment', {
      merchant_id: MERCHANT_ID,
      amount,
      currency,
      order_id: orderId,
      callback_url: callbackUrl,
    });

    return response.data;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

export const getPaymentStatus = async (paymentId: string) => {
  try {
    const response = await cryptomusClient.get(`/payment/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment status:', error);
    throw error;
  }
};
