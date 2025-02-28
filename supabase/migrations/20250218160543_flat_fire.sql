/*
  # Add extraction tables

  1. New Tables
    - `extractions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `type` (text)
      - `target` (text)
      - `status` (text)
      - `credits_used` (integer)
      - `total_records` (integer)
      - `extracted_records` (integer)
      - `error` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `last_processed_id` (text)
      - `settings` (jsonb)

    - `extraction_data`
      - `id` (uuid, primary key)
      - `extraction_id` (uuid, references extractions)
      - `data` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create extractions table
CREATE TABLE IF NOT EXISTS extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  type text NOT NULL,
  target text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  credits_used integer NOT NULL,
  total_records integer,
  extracted_records integer DEFAULT 0,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_processed_id text,
  settings jsonb
);

-- Create extraction_data table
CREATE TABLE IF NOT EXISTS extraction_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_id uuid REFERENCES extractions(id) NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_data ENABLE ROW LEVEL SECURITY;

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

-- Create policies for extraction_data
CREATE POLICY "Users can read own extraction data"
  ON extraction_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM extractions
      WHERE extractions.id = extraction_data.extraction_id
      AND extractions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own extraction data"
  ON extraction_data
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM extractions
      WHERE extractions.id = extraction_data.extraction_id
      AND extractions.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_extractions_user_id ON extractions(user_id);
CREATE INDEX idx_extractions_status ON extractions(status);
CREATE INDEX idx_extraction_data_extraction_id ON extraction_data(extraction_id);

-- Create function to update extraction progress
CREATE OR REPLACE FUNCTION update_extraction_progress(
  extraction_id uuid,
  new_status text,
  records_extracted integer DEFAULT NULL,
  error_message text DEFAULT NULL,
  last_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE extractions
  SET
    status = new_status,
    extracted_records = COALESCE(records_extracted, extracted_records),
    error = error_message,
    last_processed_id = COALESCE(last_id, last_processed_id),
    updated_at = now()
  WHERE id = extraction_id;
END;
$$;