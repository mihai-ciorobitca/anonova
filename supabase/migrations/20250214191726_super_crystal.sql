-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  initial_credits INTEGER;
  plan_name TEXT;
BEGIN
  -- Get plan name if plan_id exists in metadata
  IF NEW.raw_user_meta_data->>'plan_id' IS NOT NULL THEN
    SELECT name INTO plan_name
    FROM pricing_plans
    WHERE id = (NEW.raw_user_meta_data->>'plan_id')::uuid;
  END IF;

  -- Set initial credits based on plan
  initial_credits := CASE 
    WHEN plan_name = 'Pro Plan' THEN 2500
    WHEN plan_name = 'Enterprise Plan' THEN 10000
    ELSE 50 -- Free Plan or default
  END;

  -- Insert new user record
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    credits,
    plan_id,
    support_id,
    raw_user_meta_data
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    initial_credits,
    (NEW.raw_user_meta_data->>'plan_id')::uuid,
    NEW.raw_user_meta_data->>'support_id',
    NEW.raw_user_meta_data
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();