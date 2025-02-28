/*
 # Add Instagram orders table and functions
 
 1. New Tables
 - `instagram_orders`
 - All fields from Instagram API response
 - Additional tracking fields
 - Proper constraints and defaults
 
 2. Security
 - Enable RLS
 - Add policies for user access
 - Add helper functions
 */
-- Create instagram_orders table
CREATE TABLE instagram_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('HT', 'FL', 'FO')),
  status text NOT NULL DEFAULT 'Q',
  status_display text NOT NULL DEFAULT 'In the queue',
  source text NOT NULL,
  max_leads integer NOT NULL CHECK (max_leads > 0),
  scraped_leads integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  error text,
  settings jsonb DEFAULT '{}' :: jsonb
);

-- Enable RLS
ALTER TABLE
  instagram_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own instagram orders" ON instagram_orders FOR
SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instagram orders" ON instagram_orders FOR
INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instagram orders" ON instagram_orders FOR
UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_instagram_orders_user_id ON instagram_orders(user_id);

CREATE INDEX idx_instagram_orders_status ON instagram_orders(status);

CREATE INDEX idx_instagram_orders_created_at ON instagram_orders(created_at DESC);

-- Create function to insert Instagram order
CREATE
OR REPLACE FUNCTION insert_instagram_order(
  source_type text,
  source text,
  max_leads integer,
  settings jsonb DEFAULT '{}' :: jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public AS $ $ DECLARE new_order_id uuid;

BEGIN -- Validate source_type
IF source_type NOT IN ('HT', 'FL', 'FO') THEN RAISE EXCEPTION 'Invalid source_type. Must be HT, FL, or FO';

END IF;

-- Insert new order
INSERT INTO
  instagram_orders (
    user_id,
    source_type,
    source,
    max_leads,
    settings
  )
VALUES
  (
    auth.uid(),
    source_type,
    source,
    max_leads,
    settings
  ) RETURNING id INTO new_order_id;

RETURN new_order_id;

END;

$ $;