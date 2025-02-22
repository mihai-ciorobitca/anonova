import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<Database['public']['Tables']['users']['Update']>
) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateUserCredits = async (userId: string, creditChange: number) => {
  const { data, error } = await supabase.rpc('update_user_credits', {
    user_id: userId,
    credit_change: creditChange
  });

  if (error) throw error;
  return data;
};

export const processReferral = async (referralCode: string, newUserId: string) => {
  const { data, error } = await supabase.rpc('process_referral', {
    referral_code: referralCode,
    new_user_id: newUserId
  });

  if (error) throw error;
  return data;
};

export const getReferralStats = async (userId: string) => {
  const { data: earnings, error: earningsError } = await supabase.rpc('calculate_pending_earnings', {
    user_id: userId
  });

  if (earningsError) throw earningsError;

  const { data: referrals, error: referralsError } = await supabase
    .from('users')
    .select('id, first_name, last_name, created_at, current_plan')
    .eq('referred_by', userId);

  if (referralsError) throw referralsError;

  return {
    earnings,
    referrals
  };
};
