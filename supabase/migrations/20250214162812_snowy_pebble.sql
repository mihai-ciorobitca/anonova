/*
  # Remove redundant current_plan column and set default plan

  1. Changes
    - Remove redundant current_plan column from users table
    - Create function to get default Free Plan ID
    - Create trigger to set default plan_id for new users
    - Update existing users to have Free Plan if plan_id is null

  2. Security
    - No changes to RLS policies needed
*/

-- Create function to get Free Plan ID
CREATE OR REPLACE FUNCTION get_free_plan_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM pricing_plans WHERE name = 'Free Plan' LIMIT 1;
$$;

-- Update existing users with null plan_id to Free Plan
UPDATE users
SET plan_id = get_free_plan_id()
WHERE plan_id IS NULL;

-- Create trigger function to set default plan_id
CREATE OR REPLACE FUNCTION set_default_plan_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.plan_id IS NULL THEN
    NEW.plan_id := get_free_plan_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set plan_id
DROP TRIGGER IF EXISTS set_default_plan_id_trigger ON users;
CREATE TRIGGER set_default_plan_id_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_default_plan_id();

-- Remove current_plan column
ALTER TABLE users
DROP COLUMN IF EXISTS current_plan;