/*
  # Add User Activities Table
  
  1. New Tables
    - `user_activities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `type` (text) - activity type (subscription, extraction, purchase)
      - `description` (text) - activity description
      - `credits_change` (integer) - credit amount change
      - `credits_after` (integer) - credits after change
      - `metadata` (jsonb) - additional activity data
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policy for users to read their own activities
*/

-- Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  credits_change integer NOT NULL,
  credits_after integer NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own activities
CREATE POLICY "Users can read own activities"
  ON user_activities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_user_activities_user_id_created_at 
  ON user_activities(user_id, created_at DESC);

-- Create function to record activity
CREATE OR REPLACE FUNCTION record_user_activity(
  activity_type text,
  activity_description text,
  credits_change integer,
  activity_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits integer;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM users
  WHERE id = auth.uid();

  -- Insert activity record
  INSERT INTO user_activities (
    user_id,
    type,
    description,
    credits_change,
    credits_after,
    metadata
  )
  VALUES (
    auth.uid(),
    activity_type,
    activity_description,
    credits_change,
    current_credits,
    activity_metadata
  );
END;
$$;