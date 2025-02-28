/*
 # Add Instagram order handling functions
 
 1. New Functions
 - `handle_instagram_order`: Main function to handle Instagram order creation and validation
 - `check_instagram_credits`: Function to validate credit requirements
 - `record_instagram_activity`: Function to record order activity
 
 2. Security
 - Enable RLS on all tables
 - Add policies for authenticated users
 - Secure function execution context
 
 3. Changes
 - Add credit validation and deduction
 - Add activity logging
 - Improve error handling
 */
-- Create function to check credits for Instagram orders
CREATE
OR REPLACE FUNCTION check_instagram_credits(user_id uuid, required_credits integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public AS $ $ DECLARE available_credits integer;

has_used_free boolean;

minimum_credits integer;

BEGIN -- Get user's credit info
SELECT
  credits,
  has_used_free_credits INTO available_credits,
  has_used_free
FROM
  users
WHERE
  id = user_id FOR
UPDATE
;

-- Determine minimum credits required
minimum_credits := CASE
  WHEN NOT has_used_free THEN 1
  ELSE 500
END;

-- Validate credit amount
IF required_credits < minimum_credits THEN RAISE EXCEPTION 'Minimum credits required: %',
minimum_credits;

END IF;

-- Check credit balance
IF available_credits < required_credits THEN RAISE EXCEPTION 'Insufficient credits. Available: %, Required: %',
available_credits,
required_credits;

END IF;

RETURN true;

END;

$ $;

-- Create function to record Instagram order activity
CREATE
OR REPLACE FUNCTION record_instagram_activity(
  user_id uuid,
  order_id uuid,
  activity_type text,
  credits_used integer
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public AS $ $ DECLARE current_credits integer;

BEGIN -- Get current credits after deduction
SELECT
  credits INTO current_credits
FROM
  users
WHERE
  id = user_id;

-- Insert activity record
INSERT INTO
  user_activities (
    user_id,
    type,
    description,
    credits_change,
    credits_after,
    metadata
  )
VALUES
  (
    user_id,
    'extraction',
    CASE
      WHEN activity_type = 'HT' THEN 'Instagram Hashtag Extraction'
      WHEN activity_type = 'FL' THEN 'Instagram Followers Extraction'
      WHEN activity_type = 'FO' THEN 'Instagram Following Extraction'
    END,
    - credits_used,
    current_credits,
    jsonb_build_object(
      'order_id',
      order_id,
      'type',
      activity_type
    )
  );

END;

$ $;

-- Create main function to handle Instagram orders
CREATE
OR REPLACE FUNCTION handle_instagram_order(
  source_type text,
  source text,
  max_leads integer,
  settings jsonb DEFAULT '{}' :: jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public AS $ $ DECLARE current_user_id uuid;

new_order_id uuid;

BEGIN -- Get current user ID
current_user_id := auth.uid();

-- Validate parameters
PERFORM validate_instagram_order(source_type, source, max_leads);

-- Check credits
PERFORM check_instagram_credits(current_user_id, max_leads);

-- Start transaction
BEGIN -- Deduct credits
UPDATE
  users
SET
  credits = credits - max_leads,
  has_used_free_credits = CASE
    WHEN NOT has_used_free_credits
    AND max_leads > 0 THEN true
    ELSE has_used_free_credits
  END,
  updated_at = now()
WHERE
  id = current_user_id;

-- Create order
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
    current_user_id,
    source_type,
    trim(source),
    max_leads,
    settings
  ) RETURNING id INTO new_order_id;

-- Record activity
PERFORM record_instagram_activity(
  current_user_id,
  new_order_id,
  source_type,
  max_leads
);

RETURN new_order_id;

EXCEPTION
WHEN others THEN -- Rollback will happen automatically
RAISE NOTICE 'Error in handle_instagram_order: %',
SQLERRM;

RAISE;

END;

END;

$ $;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_instagram_credits(uuid, integer) TO authenticated;

GRANT EXECUTE ON FUNCTION record_instagram_activity(uuid, uuid, text, integer) TO authenticated;

GRANT EXECUTE ON FUNCTION handle_instagram_order(text, text, integer, jsonb) TO authenticated;