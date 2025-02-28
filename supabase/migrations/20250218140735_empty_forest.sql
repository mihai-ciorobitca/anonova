/*
  # Fix Subscription Tracking

  1. Changes
    - Add default value for subscription_start_date
    - Add validation for subscription_start_date
    - Add function to handle subscription dates
    - Update existing records with proper dates
*/

-- Add check constraint to ensure subscription_start_date is not in the future
ALTER TABLE users
DROP CONSTRAINT IF EXISTS subscription_start_date_check;

ALTER TABLE users
ADD CONSTRAINT subscription_start_date_check
CHECK (subscription_start_date <= CURRENT_TIMESTAMP);

-- Create function to handle subscription dates
CREATE OR REPLACE FUNCTION handle_subscription_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Set subscription_start_date if null
  IF NEW.subscription_start_date IS NULL THEN
    NEW.subscription_start_date = COALESCE(OLD.created_at, CURRENT_TIMESTAMP);
  END IF;

  -- Ensure previous_plans is initialized
  IF NEW.previous_plans IS NULL THEN
    NEW.previous_plans = '[]'::jsonb;
  END IF;

  -- Track plan changes with proper date handling
  IF (OLD.plan_id IS DISTINCT FROM NEW.plan_id) THEN
    -- Only add to previous_plans if there was an old plan
    IF OLD.plan_id IS NOT NULL THEN
      NEW.previous_plans = COALESCE(OLD.previous_plans, '[]'::jsonb) || jsonb_build_object(
        'plan_id', OLD.plan_id,
        'start_date', OLD.subscription_start_date,
        'end_date', CURRENT_TIMESTAMP
      );
    END IF;
    
    -- Update subscription start date for new plan
    NEW.subscription_start_date = CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger
DROP TRIGGER IF EXISTS track_plan_changes ON users;

-- Create new trigger for subscription date handling
CREATE TRIGGER handle_subscription_dates
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_dates();

-- Update existing records with proper dates
UPDATE users
SET 
  subscription_start_date = COALESCE(subscription_start_date, created_at),
  previous_plans = COALESCE(previous_plans, '[]'::jsonb)
WHERE 
  subscription_start_date IS NULL 
  OR previous_plans IS NULL;