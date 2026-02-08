-- Add is_published column to courses table
-- Run this in your Supabase SQL Editor

-- 1. Add the column (default to false initially for safety, but we'll update existing)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- 2. Update all existing courses to be TRUE so they appear on homepage immediately
UPDATE courses SET is_published = TRUE;

-- 3. (Optional) Make it NOT NULL now that we backfilled data
-- ALTER TABLE courses ALTER COLUMN is_published SET NOT NULL;
