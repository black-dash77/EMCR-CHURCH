-- =====================================================
-- Push Notifications System
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- Table: notification_logs - Track sent notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sermon', 'event', 'announcement', 'seminar', 'sunday_service', 'custom')),
  content_id UUID, -- Optional: reference to sermon/event/announcement/seminar
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Table: sunday_notification_settings - Weekly notification config
-- =====================================================
CREATE TABLE IF NOT EXISTS sunday_notification_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enabled BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '09:00:00', -- 9h par défaut
  title TEXT DEFAULT 'Culte du Dimanche',
  body TEXT DEFAULT 'Rejoignez-nous ce dimanche pour le culte. Que Dieu vous bénisse!',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO sunday_notification_settings (id, enabled, notification_time, title, body)
VALUES ('default', true, '09:00:00', 'Culte du Dimanche', 'Rejoignez-nous ce dimanche pour le culte. Que Dieu vous bénisse!')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Enable RLS
-- =====================================================
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sunday_notification_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies for notification_logs
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read notification logs" ON notification_logs;
CREATE POLICY "Anyone can read notification logs"
ON notification_logs FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can insert notification logs" ON notification_logs;
CREATE POLICY "Anyone can insert notification logs"
ON notification_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- =====================================================
-- RLS Policies for sunday_notification_settings
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read sunday settings" ON sunday_notification_settings;
CREATE POLICY "Anyone can read sunday settings"
ON sunday_notification_settings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can update sunday settings" ON sunday_notification_settings;
CREATE POLICY "Anyone can update sunday settings"
ON sunday_notification_settings FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert sunday settings" ON sunday_notification_settings;
CREATE POLICY "Anyone can insert sunday settings"
ON sunday_notification_settings FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- =====================================================
-- Verify tables created
-- =====================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('notification_logs', 'sunday_notification_settings');
