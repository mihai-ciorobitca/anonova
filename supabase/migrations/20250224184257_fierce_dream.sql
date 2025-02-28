/*
 # Add Instagram order functions and error handling
 
 1. New Functions
 - `validate_instagram_order` - Validates order parameters
 - `update_instagram_order_status` - Updates order status with proper error handling
 
 2. Changes
 - Add better validation and error handling to existing functions
 - Add status update triggers
 */
-- Create function to validate Instagram order parameters
CREATE
OR REPLACE FUNCTION validate_instagram_order(
  source_type text,
  source text,
  max_leads integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public AS $ $ BEGIN -- Validate source_type
  IF source_type NOT IN ('HT', 'FL', 'FO') THEN RAISE EXCEPTION 'Invalid source_type. Must be HT, FL, or FO';

END IF;

-- Validate source
IF source IS NULL
OR trim(source) = '' THEN RAISE EXCEPTION 'Source is required';

END IF;

RETURN true;

END;

$ $;

-- Update insert_instagram_order function with better validation
CREATE
OR REPLACE FUNCTION insert_instagram_order(
  source_type text,
  source text,
  max_leads integer,
  settings jsonb DEFAULT '{}' :: jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public AS $ $ DECLARE new_order_id uuid;

BEGIN -- Validate parameters
PERFORM validate_instagram_order(source_type, source, max_leads);

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
    trim(source),
    max_leads,
    settings
  ) RETURNING id INTO new_order_id;

RETURN new_order_id;

EXCEPTION
WHEN others THEN -- Log error details
RAISE NOTICE 'Error in insert_instagram_order: %',
SQLERRM;

RAISE;

END;

$ $;

-- Create function to update Instagram order status
CREATE
OR REPLACE FUNCTION update_instagram_order_status(
  order_id uuid,
  new_status text,
  new_status_display text,
  scraped integer DEFAULT NULL,
  error_msg text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public AS $ $ BEGIN -- Update order
UPDATE
  instagram_orders
SET
  status = new_status,
  status_display = new_status_display,
  updated_at = now(),
  completed_at = CASE
    WHEN new_status = 'C' THEN now()
    ELSE completed_at
  END,
  scraped_leads = COALESCE(scraped, scraped_leads),
  error = error_msg
WHERE
  id = order_id
  AND user_id = auth.uid();

IF NOT FOUND THEN RAISE EXCEPTION 'Order not found or access denied';

END IF;

END;

$ $;

-- Create trigger function to validate status updates
CREATE
OR REPLACE FUNCTION validate_instagram_order_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $ $ BEGIN -- Validate status transitions
IF NEW.status NOT IN ('Q', 'P', 'C', 'F') THEN RAISE EXCEPTION 'Invalid status. Must be Q (queued), P (processing), C (completed), or F (failed)';

END IF;

-- Set status_display based on status
NEW.status_display := CASE
  WHEN NEW.status = 'Q' THEN 'In the queue'
  WHEN NEW.status = 'P' THEN 'Processing'
  WHEN NEW.status = 'C' THEN 'Completed'
  WHEN NEW.status = 'F' THEN 'Failed'
  ELSE NEW.status_display
END;

RETURN NEW;

END;

$ $;

-- Create trigger for status validation
DROP TRIGGER IF EXISTS validate_instagram_order_status_trigger ON instagram_orders;

CREATE TRIGGER validate_instagram_order_status_trigger BEFORE
UPDATE
  OF status ON instagram_orders FOR EACH ROW EXECUTE FUNCTION validate_instagram_order_status();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_instagram_order(text, text, integer) TO authenticated;

GRANT EXECUTE ON FUNCTION insert_instagram_order(text, text, integer, jsonb) TO authenticated;

GRANT EXECUTE ON FUNCTION update_instagram_order_status(uuid, text, text, integer, text) TO authenticated;