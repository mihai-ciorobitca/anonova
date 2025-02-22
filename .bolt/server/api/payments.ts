import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

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
