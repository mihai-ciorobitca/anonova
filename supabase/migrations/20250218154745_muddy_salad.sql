/*
  # Create referrals tables

  1. New Tables
    - `referred_users`
      - Tracks user referral relationships and stats
      - Stores referral codes and earnings data
    - `referral_activities`
      - Tracks detailed referral activity history
      - Stores purchase and credit usage data

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create referred_users table
CREATE TABLE IF NOT EXISTS referred_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES users(id) NOT NULL,
  referred_id uuid REFERENCES users(id) NOT NULL,
  referral_code text NOT NULL,
  total_spent numeric DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Create referral_activities table
CREATE TABLE IF NOT EXISTS referral_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_user_id uuid REFERENCES referred_users(id) NOT NULL,
  activity_type text NOT NULL,
  amount numeric,
  credits numeric,
  plan text,
  rate numeric,
  referral_rate numeric,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE referred_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for referred_users
CREATE POLICY "Users can read their own referrals"
  ON referred_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

-- Create policies for referral_activities
CREATE POLICY "Users can read their referrals' activities"
  ON referral_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM referred_users
      WHERE referred_users.id = referral_activities.referred_user_id
      AND referred_users.referrer_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_referred_users_referrer_id ON referred_users(referrer_id);
CREATE INDEX idx_referred_users_referred_id ON referred_users(referred_id);
CREATE INDEX idx_referral_activities_referred_user_id ON referral_activities(referred_user_id);

-- Create function to calculate referral stats
CREATE OR REPLACE FUNCTION get_referral_stats(user_id uuid)
RETURNS TABLE (
  total_referrals bigint,
  total_earnings numeric,
  pending_earnings numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT ru.id)::bigint as total_referrals,
    COALESCE(SUM(ra.amount * ra.referral_rate), 0) as total_earnings,
    COALESCE(SUM(
      CASE WHEN ra.created_at > NOW() - INTERVAL '30 days'
      THEN ra.amount * ra.referral_rate
      ELSE 0
      END
    ), 0) as pending_earnings
  FROM referred_users ru
  LEFT JOIN referral_activities ra ON ra.referred_user_id = ru.id
  WHERE ru.referrer_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;