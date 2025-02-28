-- Create function to safely check if user exists
CREATE OR REPLACE FUNCTION check_user_exists(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = user_id
  );
END;
$$;

-- Create function to safely get user credits
CREATE OR REPLACE FUNCTION get_user_credits(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_credits integer;
BEGIN
  SELECT credits INTO user_credits
  FROM users
  WHERE id = user_id;
  
  IF user_credits IS NULL THEN
    RAISE EXCEPTION 'User not found or has no credits';
  END IF;
  
  RETURN user_credits;
END;
$$;

-- Update check_credit_balance function with better auth handling
CREATE OR REPLACE FUNCTION check_credit_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  available_credits integer;
  user_has_used_free_credits boolean;
  minimum_credits integer;
BEGIN
  -- Get current user ID from auth context
  current_user_id := auth.uid();
  
  -- Validate user exists
  IF NOT check_user_exists(current_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get user's available credits and free credits status
  SELECT 
    credits,
    has_used_free_credits INTO available_credits, user_has_used_free_credits
  FROM users
  WHERE id = current_user_id
  FOR UPDATE;

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

-- Update handle_extraction_credits function with better auth handling
CREATE OR REPLACE FUNCTION handle_extraction_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID from auth context
  current_user_id := auth.uid();
  
  -- Validate user exists
  IF NOT check_user_exists(current_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Deduct credits after successful extraction
  UPDATE users
  SET 
    credits = credits - NEW.credits_used,
    has_used_free_credits = CASE 
      WHEN NOT has_used_free_credits AND NEW.credits_used > 0 
      THEN true 
      ELSE has_used_free_credits 
    END,
    updated_at = now()
  WHERE id = current_user_id;

  RETURN NEW;
END;
$$;

-- Update existing triggers
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
GRANT EXECUTE ON FUNCTION check_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_credits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_credit_balance() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_extraction_credits() TO authenticated;