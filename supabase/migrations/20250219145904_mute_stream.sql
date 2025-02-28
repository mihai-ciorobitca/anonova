/*
  # Fix RLS policies for extractions

  1. Changes
    - Add user_id check to insert policy for extractions table
    - Ensure user_id is set correctly on insert

  2. Security
    - Enable RLS on extractions table
    - Add policies for insert, select, update operations
    - Restrict access to user's own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own extractions" ON extractions;
DROP POLICY IF EXISTS "Users can insert own extractions" ON extractions;
DROP POLICY IF EXISTS "Users can update own extractions" ON extractions;

-- Enable RLS
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;

-- Create policies for extractions
CREATE POLICY "Users can read own extractions"
  ON extractions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own extractions"
  ON extractions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own extractions"
  ON extractions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger to automatically set user_id
CREATE OR REPLACE FUNCTION set_extraction_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS set_extraction_user_id_trigger ON extractions;
CREATE TRIGGER set_extraction_user_id_trigger
  BEFORE INSERT ON extractions
  FOR EACH ROW
  EXECUTE FUNCTION set_extraction_user_id();