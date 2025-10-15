-- Migration: Add banner_url column to businesses table
-- Date: 2025-10-15
-- Description: Adds banner_url field to store business banner images (optional)

-- Add banner_url column
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN businesses.banner_url IS 'URL of the business banner image (recommended 1200x400px)';
COMMENT ON COLUMN businesses.logo_url IS 'URL of the business logo image (recommended 200x200px square)';
