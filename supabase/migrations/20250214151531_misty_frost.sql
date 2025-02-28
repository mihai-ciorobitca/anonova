/*
  # Add Subscription Tables

  1. New Tables
    - payment_methods: Store user payment methods
    - billing_history: Track billing and payment history

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  type text NOT NULL,
  last4 text,
  expiry text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create billing_history table
CREATE TABLE IF NOT EXISTS billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_methods
CREATE POLICY "Users can read own payment methods"
  ON payment_methods
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods"
  ON payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods"
  ON payment_methods
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
  ON payment_methods
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for billing_history
CREATE POLICY "Users can read own billing history"
  ON billing_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);