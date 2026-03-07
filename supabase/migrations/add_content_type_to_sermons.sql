-- Migration: Add content_type column to sermons table
-- This allows distinguishing between sermons, adoration, and louange (worship music)

-- Add content_type column with default value 'sermon'
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'sermon';

-- Add check constraint to ensure valid values
ALTER TABLE sermons ADD CONSTRAINT sermons_content_type_check
  CHECK (content_type IN ('sermon', 'adoration', 'louange'));

-- Add comment for documentation
COMMENT ON COLUMN sermons.content_type IS 'Type of content: sermon (prédication), adoration, or louange (worship music)';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_sermons_content_type ON sermons(content_type);
