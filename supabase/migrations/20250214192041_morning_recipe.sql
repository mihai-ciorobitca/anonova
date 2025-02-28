/*
  # Fix User Creation Trigger

  1. Changes
    - Add error handling to trigger function
    - Add default plan_id for new users
    - Add proper type casting
    - Add NOT NULL constraints
    - Add default values
    - Add proper error handling

  2. Security
    - Enable RLS
    - Add policies for user access
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  initial_credits INTEGER;
  default_plan_id UUID;
  user_plan_id UUID;
  plan_name TEXT;
BEGIN
  -- Get default Free Plan ID
  SELECT id INTO default_plan_id
  FROM pricing_plans
  WHERE name = 'Free Plan'
  LIMIT 1;

  -- Get plan ID from metadata or use default
  BEGIN
    user_plan_id := CASE
      WHEN NEW.raw_user_meta_data->>'plan_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'plan_id')::uuid
      ELSE default_plan_id
    END;
  EXCEPTION WHEN OTHERS THEN
    -- If any error occurs with plan_id, use default
    user_plan_id := default_plan_id;
  END;

  -- Get plan name
  SELECT name INTO plan_name
  FROM pricing_plans
  WHERE id = user_plan_id;

  -- Set initial credits based on plan
  initial_credits := CASE 
    WHEN plan_name = 'Pro Plan' THEN 2500
    WHEN plan_name = 'Enterprise Plan' THEN 10000
    ELSE 50 -- Free Plan or default
  END;

  -- Insert new user record with proper error handling
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      first_name,
      last_name,
      credits,
      plan_id,
      support_id,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      initial_credits,
      user_plan_id,
      COALESCE(NEW.raw_user_meta_data->>'support_id', 'ANV-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS')),
      NEW.raw_user_meta_data,
      NEW.raw_app_meta_data,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error details
    RAISE NOTICE 'Error creating user record: %', SQLERRM;
    RETURN NULL;
  END;

  RETURN NEW;
END;
$$;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add missing NOT NULL constraints and defaults
ALTER TABLE public.users 
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN first_name SET DEFAULT '',
  ALTER COLUMN last_name SET DEFAULT '',
  ALTER COLUMN credits SET DEFAULT 0,
  ALTER COLUMN has_used_free_credits SET DEFAULT false,
  ALTER COLUMN subscription_status SET DEFAULT 'active',
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;