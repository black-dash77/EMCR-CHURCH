-- Migration: Add youtube_url column to sermons table
-- This allows sermons to have a YouTube link for faster video streaming

ALTER TABLE sermons ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN sermons.youtube_url IS 'YouTube video URL for faster streaming (preferred over video_url for video content)';
