/*
  # Fix Orders Table Structure

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `source_type` (text) - HT, FL, FO, LI
      - `status` (text)
      - `status_display` (text)
      - `source` (text)
      - `max_leads` (integer)
      - `scraped_leads` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `error` (text)
      - `csv_url` (text)
      - `settings` (jsonb)

  2. Security
    - Enable RLS on orders table
    - Add policies for user access
    - Add function for status updates

  3. Changes
    - Drop existing orders table if exists
    - Create new orders table with proper structure
    - Add necessary indexes
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;

-- Create orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('HT', 'FL', 'FO', 'LI')),
  status text NOT NULL DEFAULT 'pending',
  status_display text NOT NULL DEFAULT 'Pending',
  source text NOT NULL,
  max_leads integer NOT NULL CHECK (max_leads > 0),
  scraped_leads integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  error text,
  csv_url text,
  settings jsonb DEFAULT '{}'::jsonb
);

-- Create order status history table
CREATE TABLE order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) NOT NULL,
  status text NOT NULL,
  status_display text NOT NULL,
  created_at timestamptz DEFAULT now(),
  notes text
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for order status history
CREATE POLICY "Users can read own order history"
  ON order_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Create function to update order status
CREATE OR REPLACE FUNCTION update_order_status(
  order_id uuid,
  new_status text,
  new_status_display text,
  notes text DEFAULT NULL,
  scraped integer DEFAULT NULL,
  error_msg text DEFAULT NULL,
  csv text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update order
  UPDATE orders
  SET 
    status = new_status,
    status_display = new_status_display,
    updated_at = now(),
    completed_at = CASE WHEN new_status = 'completed' THEN now() ELSE completed_at END,
    scraped_leads = COALESCE(scraped, scraped_leads),
    error = error_msg,
    csv_url = COALESCE(csv, csv_url)
  WHERE id = order_id;

  -- Record status change
  INSERT INTO order_status_history (
    order_id,
    status,
    status_display,
    notes
  ) VALUES (
    order_id,
    new_status,
    new_status_display,
    notes
  );
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_history_created_at ON order_status_history(created_at DESC);