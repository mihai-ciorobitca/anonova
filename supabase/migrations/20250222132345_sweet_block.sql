/*
  # Add Sample User Activities

  1. Changes
    - Creates a function to safely insert sample activities
    - Adds sample activities only if the user exists
    - Handles error cases gracefully
    
  2. Security
    - Checks for user existence before insertion
    - Uses proper error handling
    - Maintains data integrity
*/

-- Create function to safely insert sample activities
CREATE OR REPLACE FUNCTION insert_sample_activities()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  test_user_id uuid := '2775d8c5-b7d7-46ac-9d75-df800d9e660d';
  user_exists boolean;
BEGIN
  -- Check if user exists
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = test_user_id
  ) INTO user_exists;

  -- Only proceed if user exists
  IF user_exists THEN
    -- Insert sample activities
    INSERT INTO user_activities (
      user_id,
      type,
      description,
      credits_change,
      credits_after,
      metadata,
      created_at
    )
    VALUES
      (
        test_user_id,
        'subscription',
        'Upgraded to Pro Plan',
        2500,
        2500,
        jsonb_build_object('plan', 'Pro Plan', 'duration', 'monthly'),
        now() - interval '2 days'
      ),
      (
        test_user_id,
        'extraction',
        'Instagram Profile Extraction',
        -200,
        2300,
        jsonb_build_object('target', '@techinfluencer', 'records', 200),
        now() - interval '1 day'
      ),
      (
        test_user_id,
        'purchase',
        'Purchased Additional Credits',
        2500,
        4800,
        jsonb_build_object('amount', 50.00, 'payment_method', 'card'),
        now() - interval '12 hours'
      ),
      (
        test_user_id,
        'extraction',
        'Hashtag Data Extraction',
        -300,
        4500,
        jsonb_build_object('target', '#technology', 'records', 300),
        now() - interval '6 hours'
      ),
      (
        test_user_id,
        'extraction',
        'Instagram Followers Extraction',
        -500,
        4000,
        jsonb_build_object('target', '@startup_daily', 'records', 500),
        now() - interval '2 hours'
      );
  END IF;
END;
$$;

-- Execute the function
SELECT insert_sample_activities();

-- Drop the function after use
DROP FUNCTION insert_sample_activities();