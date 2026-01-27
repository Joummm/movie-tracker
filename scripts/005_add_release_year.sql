-- Add release_year column to content table (nullable)
ALTER TABLE content ADD COLUMN release_year INTEGER;

-- Add release_year column to series table (nullable)
ALTER TABLE series ADD COLUMN release_year INTEGER;
