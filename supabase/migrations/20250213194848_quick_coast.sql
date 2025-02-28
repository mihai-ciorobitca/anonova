/*
  # Storage Setup for User Avatars

  1. New Storage Configuration
    - Creates avatars storage bucket
    - Configures public access settings

  2. Security
    - Enables RLS on storage.objects
    - Creates policies for:
      - User avatar uploads
      - Avatar updates
      - Avatar deletions
      - Public read access
*/

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  FALSE,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  POSITION('avatars/' in name) = 1 AND
  POSITION(auth.uid()::text in SUBSTRING(name FROM 9)) = 1
);

-- Create policy to allow authenticated users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  POSITION('avatars/' in name) = 1 AND
  POSITION(auth.uid()::text in SUBSTRING(name FROM 9)) = 1
);

-- Create policy to allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  POSITION('avatars/' in name) = 1 AND
  POSITION(auth.uid()::text in SUBSTRING(name FROM 9)) = 1
);

-- Create policy to allow public read access to avatars
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');