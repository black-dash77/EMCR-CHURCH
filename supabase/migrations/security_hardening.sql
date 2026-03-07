-- =====================================================
-- SECURITY HARDENING MIGRATION
-- Fixes: RLS activation on all tables + restrict anon write access
-- Date: 2026-03-02
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES MISSING IT
-- =====================================================
ALTER TABLE IF EXISTS sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS church_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE RLS POLICIES FOR NEWLY PROTECTED TABLES
--    READ: anon + authenticated (public app needs to read)
--    WRITE: authenticated only (admin operations)
-- =====================================================

-- === SERMONS ===
CREATE POLICY "Public read sermons" ON sermons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth insert sermons" ON sermons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update sermons" ON sermons FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete sermons" ON sermons FOR DELETE TO authenticated USING (true);

-- === EVENTS ===
CREATE POLICY "Public read events" ON events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth insert events" ON events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update events" ON events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete events" ON events FOR DELETE TO authenticated USING (true);

-- === ANNOUNCEMENTS ===
CREATE POLICY "Public read announcements" ON announcements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth insert announcements" ON announcements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update announcements" ON announcements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete announcements" ON announcements FOR DELETE TO authenticated USING (true);

-- === MEMBERS ===
CREATE POLICY "Public read members" ON members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth insert members" ON members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update members" ON members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete members" ON members FOR DELETE TO authenticated USING (true);

-- === PHOTOS ===
CREATE POLICY "Public read photos" ON photos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth insert photos" ON photos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update photos" ON photos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete photos" ON photos FOR DELETE TO authenticated USING (true);

-- === MINISTRIES ===
CREATE POLICY "Public read ministries" ON ministries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth insert ministries" ON ministries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update ministries" ON ministries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete ministries" ON ministries FOR DELETE TO authenticated USING (true);

-- === CONTACT_MESSAGES ===
-- anon can INSERT (contact form from app) and SELECT (for admin)
CREATE POLICY "Public read contact_messages" ON contact_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert contact_messages" ON contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Auth update contact_messages" ON contact_messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete contact_messages" ON contact_messages FOR DELETE TO authenticated USING (true);

-- === SPEAKERS ===
CREATE POLICY "Public read speakers" ON speakers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth insert speakers" ON speakers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update speakers" ON speakers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete speakers" ON speakers FOR DELETE TO authenticated USING (true);

-- === CHURCH_SETTINGS ===
CREATE POLICY "Public read church_settings" ON church_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth insert church_settings" ON church_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update church_settings" ON church_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- 3. FIX EXISTING OVERLY PERMISSIVE POLICIES
--    Replace anon write access with authenticated only
-- =====================================================

-- === SEMINARS TABLE ===
DROP POLICY IF EXISTS "Anyone can insert seminars" ON seminars;
DROP POLICY IF EXISTS "Anyone can update seminars" ON seminars;
DROP POLICY IF EXISTS "Anyone can delete seminars" ON seminars;

CREATE POLICY "Auth insert seminars" ON seminars FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update seminars" ON seminars FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete seminars" ON seminars FOR DELETE TO authenticated USING (true);

-- === DEVICE_TOKENS TABLE ===
-- Keep anon INSERT (app registers tokens) and SELECT (check existence)
-- But restrict UPDATE and DELETE to authenticated
DROP POLICY IF EXISTS "Anyone can update device tokens" ON device_tokens;
DROP POLICY IF EXISTS "Anyone can delete device tokens" ON device_tokens;

CREATE POLICY "Auth update device_tokens" ON device_tokens FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete device_tokens" ON device_tokens FOR DELETE TO authenticated USING (true);

-- === NOTIFICATION_PREFERENCES TABLE ===
-- Keep anon INSERT (app creates prefs) and SELECT (app reads prefs)
-- But restrict UPDATE and DELETE to authenticated
DROP POLICY IF EXISTS "Anyone can update notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Anyone can delete notification preferences" ON notification_preferences;

CREATE POLICY "Auth update notification_preferences" ON notification_preferences FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete notification_preferences" ON notification_preferences FOR DELETE TO authenticated USING (true);

-- === NOTIFICATION_LOGS TABLE ===
-- Only service_role (Edge Functions) should insert logs
-- Keep anon read for admin panel
DROP POLICY IF EXISTS "Anyone can insert notification logs" ON notification_logs;

CREATE POLICY "Auth insert notification_logs" ON notification_logs FOR INSERT TO authenticated WITH CHECK (true);

-- === SUNDAY_NOTIFICATION_SETTINGS TABLE ===
-- Only authenticated users should modify settings
DROP POLICY IF EXISTS "Anyone can update sunday settings" ON sunday_notification_settings;
DROP POLICY IF EXISTS "Anyone can insert sunday settings" ON sunday_notification_settings;

CREATE POLICY "Auth update sunday_settings" ON sunday_notification_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth insert sunday_settings" ON sunday_notification_settings FOR INSERT TO authenticated WITH CHECK (true);

-- === CHURCH_INFO TABLE ===
DROP POLICY IF EXISTS "Allow insert church_info" ON church_info;
DROP POLICY IF EXISTS "Allow update church_info" ON church_info;

CREATE POLICY "Auth insert church_info" ON church_info FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update church_info" ON church_info FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- 4. FIX STORAGE BUCKET POLICIES
--    Replace anon write access with authenticated only
-- =====================================================

-- Seminars bucket
DROP POLICY IF EXISTS "Authenticated upload for seminars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update for seminars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete for seminars" ON storage.objects;

CREATE POLICY "Auth upload seminars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'seminars');
CREATE POLICY "Auth update seminars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'seminars');
CREATE POLICY "Auth delete seminars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'seminars');

-- Speakers bucket
DROP POLICY IF EXISTS "Authenticated upload for speakers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update for speakers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete for speakers" ON storage.objects;

CREATE POLICY "Auth upload speakers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'speakers');
CREATE POLICY "Auth update speakers" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'speakers');
CREATE POLICY "Auth delete speakers" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'speakers');

-- Announcements bucket
DROP POLICY IF EXISTS "Authenticated upload for announcements" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update for announcements" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete for announcements" ON storage.objects;

CREATE POLICY "Auth upload announcements" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'announcements');
CREATE POLICY "Auth update announcements" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'announcements');
CREATE POLICY "Auth delete announcements" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'announcements');

-- Sermons bucket
DROP POLICY IF EXISTS "Authenticated upload for sermons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update for sermons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete for sermons" ON storage.objects;

CREATE POLICY "Auth upload sermons" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sermons');
CREATE POLICY "Auth update sermons" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'sermons');
CREATE POLICY "Auth delete sermons" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'sermons');

-- Sermons-video bucket
DROP POLICY IF EXISTS "Auth upload sermons-video" ON storage.objects;
DROP POLICY IF EXISTS "Auth update sermons-video" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete sermons-video" ON storage.objects;

CREATE POLICY "Auth upload sermons-video" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sermons-video');
CREATE POLICY "Auth update sermons-video" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'sermons-video');
CREATE POLICY "Auth delete sermons-video" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'sermons-video');

-- =====================================================
-- 5. VERIFY
-- =====================================================
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
