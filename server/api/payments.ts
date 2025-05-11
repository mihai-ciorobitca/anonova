import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import express from 'express';
import { createPayment } from '../../src/services/cryptomus';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const processPayout = async (
  userId: string,
  amount: number,
  ethPrice: number
) => {
  const { data, error } = await supabase.rpc('process_payout', {
    user_id: userId,
    amount,
    eth_price: ethPrice
  });

  if (error) throw error;
  return data;
};

export const getPayoutHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getReferralEarnings = async (userId: string) => {
  const { data, error } = await supabase
    .from('referral_earnings')
    .select(`
      *,
      referred:referred_id (
        first_name,
        last_name,
        current_plan
      )
    `)
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const router = express.Router();

router.post('/create', async (req, res) => {
  const { amount, currency, orderId, callbackUrl } = req.body;

  if (!amount || !currency || !orderId || !callbackUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const payment = await createPayment(amount, currency, orderId, callbackUrl);
    res.status(200).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

export default router;