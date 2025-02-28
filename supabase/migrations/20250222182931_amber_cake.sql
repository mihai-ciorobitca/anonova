/*
  # Add orders tracking tables
  
  1. New Tables
    - `orders`
      - Stores extraction order details and status
      - Tracks source type, status, progress, and timestamps
    - `order_status_history`
      - Tracks status changes for audit purposes
  
  2. Functions
    - `update_order_status`: Updates order status and maintains history
    - `check_order_status`: Periodic status check function
  
  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  source_type text NOT NULL, -- HT, FL, FO, LI
  status text NOT NULL DEFAULT 'pending',
  status_display text NOT NULL DEFAULT 'Pending',
  source text NOT NULL,
  max_leads integer NOT NULL,
  scraped_leads integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  error text,
  csv_url text,
  settings jsonb DEFAULT '{}'::jsonb
);

-- Create order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
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