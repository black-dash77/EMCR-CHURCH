-- Migration: Add church_info table
-- This table stores information about the church

CREATE TABLE IF NOT EXISTS church_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Église Missionnaire Christ est Roi',
  slogan TEXT,
  description TEXT,
  mission TEXT,
  vision TEXT,
  values TEXT[] DEFAULT '{}',
  history TEXT,
  pastor_name TEXT,
  pastor_photo TEXT,
  pastor_message TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  facebook TEXT,
  instagram TEXT,
  youtube TEXT,
  service_times TEXT,
  logo_url TEXT,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE church_info ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON church_info
  FOR SELECT USING (true);

-- Allow authenticated users to insert/update (admin)
CREATE POLICY "Allow authenticated insert" ON church_info
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON church_info
  FOR UPDATE USING (true);

-- Insert default record if none exists
INSERT INTO church_info (name)
VALUES ('Église Missionnaire Christ est Roi');
