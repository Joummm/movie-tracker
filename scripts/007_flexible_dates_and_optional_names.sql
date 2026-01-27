-- Migration: Flexible dates and optional names
-- This migration changes watched_date to be more flexible (year only, month/year, or full date)
-- and makes name fields optional

-- First, let's alter the content table to support flexible dates
-- We'll use separate columns for year, month, day to allow partial dates

-- Add new date columns
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS watched_year integer;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS watched_month integer CHECK (watched_month >= 1 AND watched_month <= 12);
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS watched_day integer CHECK (watched_day >= 1 AND watched_day <= 31);

-- Migrate existing data from watched_date to new columns
UPDATE public.content 
SET 
  watched_year = EXTRACT(YEAR FROM watched_date)::integer,
  watched_month = EXTRACT(MONTH FROM watched_date)::integer,
  watched_day = EXTRACT(DAY FROM watched_date)::integer
WHERE watched_date IS NOT NULL AND watched_year IS NULL;

-- Make watched_date nullable (keep for backwards compatibility)
ALTER TABLE public.content ALTER COLUMN watched_date DROP NOT NULL;
ALTER TABLE public.content ALTER COLUMN watched_date DROP DEFAULT;

-- Make name optional in content table
ALTER TABLE public.content ALTER COLUMN name DROP NOT NULL;

-- Make name optional in series table  
ALTER TABLE public.series ALTER COLUMN name DROP NOT NULL;

-- Add index for flexible date queries
CREATE INDEX IF NOT EXISTS idx_content_watched_year ON public.content(watched_year);
CREATE INDEX IF NOT EXISTS idx_content_watched_month ON public.content(watched_month);
