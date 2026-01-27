-- Migration: Add Actors, Podcasts, Reviews, Multiple Viewings
-- Run this in your Supabase SQL Editor

-- 1. Add "unknown" to date_precision type by updating content table
ALTER TABLE content ADD COLUMN IF NOT EXISTS date_unknown BOOLEAN DEFAULT FALSE;

-- 2. Create Actors table
CREATE TABLE IF NOT EXISTS actors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  birth_date DATE,
  nationality TEXT,
  biography TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Content-Actors association table
CREATE TABLE IF NOT EXISTS content_actors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES actors(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT content_or_series CHECK (content_id IS NOT NULL OR series_id IS NOT NULL)
);

-- 4. Create Podcasts table (similar to series)
CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  cover_image TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'abandoned', 'completed')),
  release_year INTEGER,
  description TEXT,
  host TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Podcast Episodes table
CREATE TABLE IF NOT EXISTS podcast_episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  episode_number INTEGER,
  season INTEGER DEFAULT 1,
  cover_image TEXT,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  duration INTEGER,
  watched_date DATE,
  watched_year INTEGER,
  watched_month INTEGER,
  date_precision TEXT DEFAULT 'full' CHECK (date_precision IN ('full', 'month', 'year')),
  date_unknown BOOLEAN DEFAULT FALSE,
  notes TEXT,
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add review field to content table
ALTER TABLE content ADD COLUMN IF NOT EXISTS review TEXT;

-- 7. Create Collections table (generic grouping, not just series)
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  description TEXT,
  cover_image TEXT,
  collection_type TEXT DEFAULT 'custom' CHECK (collection_type IN ('custom', 'franchise', 'universe', 'anthology')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Collection Items table
CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT collection_item_type CHECK (
    (content_id IS NOT NULL AND series_id IS NULL AND podcast_id IS NULL) OR
    (content_id IS NULL AND series_id IS NOT NULL AND podcast_id IS NULL) OR
    (content_id IS NULL AND series_id IS NULL AND podcast_id IS NOT NULL)
  )
);

-- 9. Create Content Viewings table (for multiple watch dates)
CREATE TABLE IF NOT EXISTS content_viewings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE NOT NULL,
  watched_date DATE,
  watched_year INTEGER,
  watched_month INTEGER,
  date_precision TEXT DEFAULT 'full' CHECK (date_precision IN ('full', 'month', 'year')),
  date_unknown BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Make series name optional
ALTER TABLE series ALTER COLUMN name DROP NOT NULL;

-- 11. Enable RLS on new tables
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_viewings ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies for actors
CREATE POLICY "Users can view own actors" ON actors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own actors" ON actors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own actors" ON actors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own actors" ON actors FOR DELETE USING (auth.uid() = user_id);

-- 13. Create RLS policies for content_actors
CREATE POLICY "Users can view own content_actors" ON content_actors FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM content WHERE content.id = content_actors.content_id AND content.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM series WHERE series.id = content_actors.series_id AND series.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own content_actors" ON content_actors FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM content WHERE content.id = content_actors.content_id AND content.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM series WHERE series.id = content_actors.series_id AND series.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own content_actors" ON content_actors FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM content WHERE content.id = content_actors.content_id AND content.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM series WHERE series.id = content_actors.series_id AND series.user_id = auth.uid())
  );

-- 14. Create RLS policies for podcasts
CREATE POLICY "Users can view own podcasts" ON podcasts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own podcasts" ON podcasts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own podcasts" ON podcasts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own podcasts" ON podcasts FOR DELETE USING (auth.uid() = user_id);

-- 15. Create RLS policies for podcast_episodes
CREATE POLICY "Users can view own podcast_episodes" ON podcast_episodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own podcast_episodes" ON podcast_episodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own podcast_episodes" ON podcast_episodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own podcast_episodes" ON podcast_episodes FOR DELETE USING (auth.uid() = user_id);

-- 16. Create RLS policies for collections
CREATE POLICY "Users can view own collections" ON collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own collections" ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON collections FOR DELETE USING (auth.uid() = user_id);

-- 17. Create RLS policies for collection_items
CREATE POLICY "Users can view own collection_items" ON collection_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_items.collection_id AND collections.user_id = auth.uid()));
CREATE POLICY "Users can insert own collection_items" ON collection_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_items.collection_id AND collections.user_id = auth.uid()));
CREATE POLICY "Users can delete own collection_items" ON collection_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_items.collection_id AND collections.user_id = auth.uid()));

-- 18. Create RLS policies for content_viewings
CREATE POLICY "Users can view own content_viewings" ON content_viewings FOR SELECT 
  USING (EXISTS (SELECT 1 FROM content WHERE content.id = content_viewings.content_id AND content.user_id = auth.uid()));
CREATE POLICY "Users can insert own content_viewings" ON content_viewings FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM content WHERE content.id = content_viewings.content_id AND content.user_id = auth.uid()));
CREATE POLICY "Users can update own content_viewings" ON content_viewings FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM content WHERE content.id = content_viewings.content_id AND content.user_id = auth.uid()));
CREATE POLICY "Users can delete own content_viewings" ON content_viewings FOR DELETE 
  USING (EXISTS (SELECT 1 FROM content WHERE content.id = content_viewings.content_id AND content.user_id = auth.uid()));

-- 19. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_actors_content_id ON content_actors(content_id);
CREATE INDEX IF NOT EXISTS idx_content_actors_series_id ON content_actors(series_id);
CREATE INDEX IF NOT EXISTS idx_content_actors_actor_id ON content_actors(actor_id);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_podcast_id ON podcast_episodes(podcast_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_content_viewings_content_id ON content_viewings(content_id);
