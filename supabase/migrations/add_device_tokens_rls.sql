-- =====================================================
-- Storage Buckets & RLS Policies
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- Create Storage Buckets (if they don't exist)
-- =====================================================

-- Seminars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('seminars', 'seminars', true)
ON CONFLICT (id) DO NOTHING;

-- Speakers bucket (if not already created)
INSERT INTO storage.buckets (id, name, public)
VALUES ('speakers', 'speakers', true)
ON CONFLICT (id) DO NOTHING;

-- Announcements bucket (if not already created)
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

-- Sermons bucket (for cover images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sermons', 'sermons', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Storage Policies for all buckets
-- =====================================================

-- Seminars bucket policies
DROP POLICY IF EXISTS "Public read access for seminars" ON storage.objects;
CREATE POLICY "Public read access for seminars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'seminars');

DROP POLICY IF EXISTS "Authenticated upload for seminars" ON storage.objects;
CREATE POLICY "Authenticated upload for seminars"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'seminars');

DROP POLICY IF EXISTS "Authenticated update for seminars" ON storage.objects;
CREATE POLICY "Authenticated update for seminars"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'seminars');

DROP POLICY IF EXISTS "Authenticated delete for seminars" ON storage.objects;
CREATE POLICY "Authenticated delete for seminars"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'seminars');

-- Speakers bucket policies
DROP POLICY IF EXISTS "Public read access for speakers" ON storage.objects;
CREATE POLICY "Public read access for speakers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'speakers');

DROP POLICY IF EXISTS "Authenticated upload for speakers" ON storage.objects;
CREATE POLICY "Authenticated upload for speakers"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'speakers');

DROP POLICY IF EXISTS "Authenticated update for speakers" ON storage.objects;
CREATE POLICY "Authenticated update for speakers"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'speakers');

DROP POLICY IF EXISTS "Authenticated delete for speakers" ON storage.objects;
CREATE POLICY "Authenticated delete for speakers"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'speakers');

-- Announcements bucket policies
DROP POLICY IF EXISTS "Public read access for announcements" ON storage.objects;
CREATE POLICY "Public read access for announcements"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'announcements');

DROP POLICY IF EXISTS "Authenticated upload for announcements" ON storage.objects;
CREATE POLICY "Authenticated upload for announcements"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'announcements');

DROP POLICY IF EXISTS "Authenticated update for announcements" ON storage.objects;
CREATE POLICY "Authenticated update for announcements"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'announcements');

DROP POLICY IF EXISTS "Authenticated delete for announcements" ON storage.objects;
CREATE POLICY "Authenticated delete for announcements"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'announcements');

-- Sermons bucket policies
DROP POLICY IF EXISTS "Public read access for sermons" ON storage.objects;
CREATE POLICY "Public read access for sermons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'sermons');

DROP POLICY IF EXISTS "Authenticated upload for sermons" ON storage.objects;
CREATE POLICY "Authenticated upload for sermons"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'sermons');

DROP POLICY IF EXISTS "Authenticated update for sermons" ON storage.objects;
CREATE POLICY "Authenticated update for sermons"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'sermons');

DROP POLICY IF EXISTS "Authenticated delete for sermons" ON storage.objects;
CREATE POLICY "Authenticated delete for sermons"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'sermons');

-- =====================================================
-- RLS Policies for seminars table
-- =====================================================

-- Enable RLS on seminars table (if not already enabled)
ALTER TABLE seminars ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read seminars" ON seminars;
DROP POLICY IF EXISTS "Anyone can insert seminars" ON seminars;
DROP POLICY IF EXISTS "Anyone can update seminars" ON seminars;
DROP POLICY IF EXISTS "Anyone can delete seminars" ON seminars;

-- Allow anyone to read seminars
CREATE POLICY "Anyone can read seminars"
ON seminars
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to insert seminars (for admin panel)
CREATE POLICY "Anyone can insert seminars"
ON seminars
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to update seminars
CREATE POLICY "Anyone can update seminars"
ON seminars
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow anyone to delete seminars
CREATE POLICY "Anyone can delete seminars"
ON seminars
FOR DELETE
TO anon, authenticated
USING (true);

-- =====================================================
-- RLS Policies for device_tokens and notification_preferences
-- =====================================================

-- Enable RLS on tables (if not already enabled)
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert device tokens" ON device_tokens;
DROP POLICY IF EXISTS "Anyone can read device tokens" ON device_tokens;
DROP POLICY IF EXISTS "Anyone can update device tokens" ON device_tokens;
DROP POLICY IF EXISTS "Anyone can delete device tokens" ON device_tokens;

DROP POLICY IF EXISTS "Anyone can read notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Anyone can insert notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Anyone can update notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Anyone can delete notification preferences" ON notification_preferences;

-- =====================================================
-- Device Tokens Policies
-- Since tokens are anonymous, we allow public access
-- The device_token acts as the "key" for operations
-- =====================================================

-- Allow anyone to insert their device token
CREATE POLICY "Anyone can insert device tokens"
ON device_tokens
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to read device tokens (needed to check if token exists)
CREATE POLICY "Anyone can read device tokens"
ON device_tokens
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to update device tokens
CREATE POLICY "Anyone can update device tokens"
ON device_tokens
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow anyone to delete device tokens
CREATE POLICY "Anyone can delete device tokens"
ON device_tokens
FOR DELETE
TO anon, authenticated
USING (true);

-- =====================================================
-- Notification Preferences Policies
-- =====================================================

-- Allow anyone to read notification preferences
CREATE POLICY "Anyone can read notification preferences"
ON notification_preferences
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to insert notification preferences
CREATE POLICY "Anyone can insert notification preferences"
ON notification_preferences
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to update notification preferences
CREATE POLICY "Anyone can update notification preferences"
ON notification_preferences
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow anyone to delete notification preferences
CREATE POLICY "Anyone can delete notification preferences"
ON notification_preferences
FOR DELETE
TO anon, authenticated
USING (true);

-- =====================================================
-- Verify policies were created
-- =====================================================
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('device_tokens', 'notification_preferences');
