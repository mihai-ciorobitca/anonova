/*
  # Add Subscription Tracking

  1. New Fields
    - `subscription_start_date` - When user started their current plan
    - `previous_plans` - History of plan changes
  
  2. Changes
    - Add new fields to users table
    - Add function to track plan changes
*/

-- Add subscription tracking fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_start_date timestamptz,
ADD COLUMN IF NOT EXISTS previous_plans jsonb DEFAULT '[]'::jsonb;

-- Update existing users to set subscription_start_date to created_at
UPDATE users
SET subscription_start_date = created_at
WHERE subscription_start_date IS NULL;

-- Create function to track plan changes
CREATE OR REPLACE FUNCTION track_plan_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.plan_id IS DISTINCT FROM NEW.plan_id) THEN
    -- Store the old plan in previous_plans
    NEW.previous_plans = COALESCE(OLD.previous_plans, '[]'::jsonb) || jsonb_build_object(
      'plan_id', OLD.plan_id,
      'start_date', OLD.subscription_start_date,
      'end_date', CURRENT_TIMESTAMP
    );
    
    -- Set new subscription start date
    NEW.subscription_start_date = CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for plan changes
DROP TRIGGER IF EXISTS track_plan_changes ON users;
CREATE TRIGGER track_plan_changes
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION track_plan_change();