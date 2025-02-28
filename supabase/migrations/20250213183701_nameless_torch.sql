/*
  # Create pricing plans table and update users table

  1. New Tables
    - `pricing_plans`
      - `id` (uuid, primary key)
      - `name` (text)
      - `price_monthly` (numeric)
      - `price_annual` (numeric)
      - `credit_rate` (numeric)
      - `min_credits` (integer)
      - `included_credits` (integer)
      - `features` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add `plan_id` foreign key to users table
    - Add default pricing plans data

  3. Security
    - Enable RLS on pricing_plans table
    - Add policy for public read access
*/

-- Create pricing_plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_monthly numeric,
  price_annual numeric,
  credit_rate numeric NOT NULL,
  min_credits integer NOT NULL,
  included_credits integer,
  features jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add plan_id to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE users ADD COLUMN plan_id uuid REFERENCES pricing_plans(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access" ON pricing_plans
  FOR SELECT TO public USING (true);

-- Insert default pricing plans
INSERT INTO pricing_plans (name, price_monthly, price_annual, credit_rate, min_credits, included_credits, features)
VALUES
  (
    'Free Plan',
    NULL,
    NULL,
    0.03,
    500,
    NULL,
    '["Basic data extraction", "Export to CSV", "Email support", "Pay as you go", "No monthly fees"]'::jsonb
  ),
  (
    'Pro Plan',
    50,
    480,
    0.02,
    2500,
    2500,
    '["Advanced data extraction", "All export formats", "Priority support", "Bulk extraction", "Ghost mode scraping"]'::jsonb
  ),
  (
    'Enterprise Plan',
    99,
    950,
    0.01,
    25000,
    10000,
    '["Unlimited data extraction", "Dedicated support", "Team collaboration", "Advanced analytics", "Volume discounts"]'::jsonb
  );