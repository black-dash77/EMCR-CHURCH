-- =====================================================
-- Add video_url column to sermons table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add video_url column to sermons table
ALTER TABLE sermons
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- =====================================================
-- Create Storage Bucket for sermon videos
-- =====================================================

-- Sermons video bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('sermons-video', 'sermons-video', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Storage Policies for sermons-video bucket
-- =====================================================

-- Public read access
DROP POLICY IF EXISTS "Public read access for sermons-video" ON storage.objects;
CREATE POLICY "Public read access for sermons-video"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'sermons-video');

-- Authenticated upload
DROP POLICY IF EXISTS "Authenticated upload for sermons-video" ON storage.objects;
CREATE POLICY "Authenticated upload for sermons-video"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'sermons-video');

-- Authenticated update
DROP POLICY IF EXISTS "Authenticated update for sermons-video" ON storage.objects;
CREATE POLICY "Authenticated update for sermons-video"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'sermons-video');

-- Authenticated delete
DROP POLICY IF EXISTS "Authenticated delete for sermons-video" ON storage.objects;
CREATE POLICY "Authenticated delete for sermons-video"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'sermons-video');

-- =====================================================
-- Verify the changes
-- =====================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sermons' AND column_name = 'video_url';
