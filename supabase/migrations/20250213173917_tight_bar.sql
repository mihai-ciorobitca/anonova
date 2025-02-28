/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - matches auth.users.id
      - `email` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `last_login` (timestamptz, nullable)
      - `credits` (integer)
      - `has_used_free_credits` (boolean)
      - `current_plan` (text)
      - `subscription_status` (text)
      - `next_billing_date` (timestamptz, nullable)
      - `eth_wallet_address` (text, nullable)
      - `referral_code` (text, nullable)
      - `referred_by` (text, nullable)
      - `support_id` (text, nullable)
      - `settings` (jsonb, nullable)
      - `raw_app_meta_data` (jsonb, nullable)
      - `raw_user_meta_data` (jsonb, nullable)
      - `is_super_admin` (boolean)

  2. Security
    - Enable RLS on users table
    - Add policies for authenticated users to read/update their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  credits integer DEFAULT 0,
  has_used_free_credits boolean DEFAULT false,
  current_plan text DEFAULT 'free',
  subscription_status text DEFAULT 'active',
  next_billing_date timestamptz,
  eth_wallet_address text,
  referral_code text,
  referred_by text,
  support_id text,
  settings jsonb,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, raw_user_meta_data)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user record
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();