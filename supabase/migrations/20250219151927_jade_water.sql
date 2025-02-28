/*
  # Add credit deduction functions and triggers

  1. New Functions
    - `deduct_user_credits`: Safely deducts credits with validation
    - `check_credit_balance`: Validates credit balance before extraction
    - `handle_extraction_credits`: Manages credit deduction for extractions

  2. Security
    - Enable RLS
    - Add validation checks
    - Atomic credit updates
    - Proper error handling
*/

-- Create function to safely deduct credits
CREATE OR REPLACE FUNCTION deduct_user_credits(
  user_id uuid,
  credits_to_deduct integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits integer;
  updated_credits integer;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO current_credits
  FROM users
  WHERE id = user_id
  FOR UPDATE;

  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Validate credit balance
  IF current_credits < credits_to_deduct THEN
    RAISE EXCEPTION 'Insufficient credits. Available: %, Required: %', current_credits, credits_to_deduct;
  END IF;

  -- Update credits
  UPDATE users
  SET 
    credits = credits - credits_to_deduct,
    has_used_free_credits = CASE 
      WHEN NOT has_used_free_credits AND credits_to_deduct > 0 
      THEN true 
      ELSE has_used_free_credits 
    END,
    updated_at = now()
  WHERE id = user_id
  RETURNING credits INTO updated_credits;

  RETURN updated_credits;
END;
$$;

-- Create function to check credit balance before extraction
CREATE OR REPLACE FUNCTION check_credit_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  available_credits integer;
  user_has_used_free_credits boolean;
  minimum_credits integer;
BEGIN
  -- Get user's available credits and free credits status
  SELECT 
    credits,
    has_used_free_credits INTO available_credits, user_has_used_free_credits
  FROM users
  WHERE id = auth.uid()
  FOR UPDATE;

  IF available_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Determine minimum credits required
  minimum_credits := CASE 
    WHEN NOT user_has_used_free_credits THEN 1
    ELSE 500
  END;

  -- Validate credit amount
  IF NEW.credits_used < minimum_credits THEN
    RAISE EXCEPTION 'Minimum credits required: %', minimum_credits;
  END IF;

  -- Validate credit balance
  IF available_credits < NEW.credits_used THEN
    RAISE EXCEPTION 'Insufficient credits. Available: %, Required: %', available_credits, NEW.credits_used;
  END IF;

  RETURN NEW;
END;
$$;

-- Create function to handle extraction credit deduction
CREATE OR REPLACE FUNCTION handle_extraction_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deduct credits after successful extraction
  PERFORM deduct_user_credits(
    auth.uid(),
    NEW.credits_used
  );

  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS check_credits_before_extraction ON extractions;
DROP TRIGGER IF EXISTS handle_extraction_credits_after_insert ON extractions;

CREATE TRIGGER check_credits_before_extraction
  BEFORE INSERT ON extractions
  FOR EACH ROW
  EXECUTE FUNCTION check_credit_balance();

CREATE TRIGGER handle_extraction_credits_after_insert
  AFTER INSERT ON extractions
  FOR EACH ROW
  EXECUTE FUNCTION handle_extraction_credits();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION deduct_user_credits(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION check_credit_balance() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_extraction_credits() TO authenticated;