-- ========================================
-- Arquivo: 011_enhance_actors_and_podcasts.sql
-- ========================================

-- Migration: Enhance Actors system, add full Podcasts support, content collections, and structure improvements

-- 1. Make all name fields optional and add unknown date support
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS date_precision TEXT DEFAULT 'full' CHECK (date_precision IN ('full', 'month', 'year', 'unknown'));
ALTER TABLE public.podcast_episodes ADD COLUMN IF NOT EXISTS date_precision TEXT DEFAULT 'full' CHECK (date_precision IN ('full', 'month', 'year', 'unknown'));

-- 2. Update actors table with more fields
ALTER TABLE public.actors ADD COLUMN IF NOT EXISTS 
  biography TEXT,
  birth_date DATE,
  death_date DATE,
  nationality TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'other')),
  tmdb_id TEXT,
  imdb_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Add actor_roles table for different roles (actor, director, writer, etc.)
CREATE TYPE role_type AS ENUM ('actor', 'director', 'writer', 'producer', 'composer', 'cinematographer');

CREATE TABLE IF NOT EXISTS public.actor_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_actor_id UUID REFERENCES public.content_actors(id) ON DELETE CASCADE NOT NULL,
  role role_type NOT NULL DEFAULT 'actor',
  character_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add reviews table for more detailed reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  series_id UUID REFERENCES public.series(id) ON DELETE CASCADE,
  podcast_id UUID REFERENCES public.podcasts(id) ON DELETE CASCADE,
  podcast_episode_id UUID REFERENCES public.podcast_episodes(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  is_spoiler BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT review_target CHECK (
    (content_id IS NOT NULL)::integer + 
    (series_id IS NOT NULL)::integer + 
    (podcast_id IS NOT NULL)::integer + 
    (podcast_episode_id IS NOT NULL)::integer = 1
  )
);

-- 5. Create content_type_other for non-series groupings
CREATE TABLE IF NOT EXISTS public.content_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  description TEXT,
  cover_image TEXT,
  group_type TEXT DEFAULT 'collection' CHECK (group_type IN ('collection', 'franchise', 'anthology', 'universe')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.content_group_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.content_groups(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  series_id UUID REFERENCES public.series(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT group_item_type CHECK (
    (content_id IS NOT NULL AND series_id IS NULL) OR 
    (content_id IS NULL AND series_id IS NOT NULL)
  ),
  UNIQUE(group_id, content_id, series_id)
);

-- 6. Enhance series structure for pre-defined seasons/episodes
ALTER TABLE public.series_seasons ADD COLUMN IF NOT EXISTS 
  name TEXT,
  description TEXT,
  release_year INTEGER,
  poster_image TEXT;

ALTER TABLE public.series_episodes ADD COLUMN IF NOT EXISTS
  name TEXT,
  description TEXT,
  release_date DATE,
  duration INTEGER,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  is_watched BOOLEAN DEFAULT false,
  watched_date DATE,
  watched_rating DECIMAL(3,1) CHECK (watched_rating >= 0 AND watched_rating <= 10),
  notes TEXT,
  content_id UUID REFERENCES public.content(id) ON DELETE SET NULL;

-- 7. Add series_status for more detailed tracking
CREATE TYPE series_tracking_status AS ENUM ('not_started', 'watching', 'completed', 'abandoned', 'on_hold');

ALTER TABLE public.series ADD COLUMN IF NOT EXISTS 
  tracking_status series_tracking_status DEFAULT 'not_started',
  current_season INTEGER DEFAULT 1,
  current_episode INTEGER DEFAULT 1,
  total_seasons INTEGER DEFAULT 0,
  total_episodes INTEGER DEFAULT 0;

-- 8. Create quick_watch function for series episodes
CREATE OR REPLACE FUNCTION public.quick_watch_episode(
  p_episode_id UUID,
  p_watched_date DATE DEFAULT CURRENT_DATE,
  p_rating DECIMAL DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_id UUID;
  v_series_id UUID;
  v_season_id UUID;
  v_episode_number INTEGER;
  v_season_number INTEGER;
  v_episode_name TEXT;
BEGIN
  -- Get episode details
  SELECT series_id, season_id, episode_number, name
  INTO v_series_id, v_season_id, v_episode_number, v_episode_name
  FROM public.series_episodes
  WHERE id = p_episode_id;
  
  -- Get season number
  SELECT season_number INTO v_season_number
  FROM public.series_seasons
  WHERE id = v_season_id;
  
  -- Create content entry
  INSERT INTO public.content (
    user_id,
    type,
    name,
    series_id,
    season,
    episode,
    watched_date,
    rating,
    notes
  )
  SELECT 
    user_id,
    'episode',
    v_episode_name,
    v_series_id,
    v_season_number,
    v_episode_number,
    p_watched_date,
    p_rating,
    p_notes
  FROM public.series
  WHERE id = v_series_id
  RETURNING id INTO v_content_id;
  
  -- Update episode as watched
  UPDATE public.series_episodes
  SET 
    is_watched = true,
    watched_date = p_watched_date,
    watched_rating = p_rating,
    notes = p_notes,
    content_id = v_content_id,
    updated_at = NOW()
  WHERE id = p_episode_id;
  
  -- Update series tracking
  UPDATE public.series
  SET 
    current_season = v_season_number,
    current_episode = v_episode_number + 1,
    updated_at = NOW()
  WHERE id = v_series_id;
  
  RETURN v_content_id;
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.actor_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_group_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
-- actor_roles
CREATE POLICY "Users can view own actor_roles" ON actor_roles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM content_actors ca
      LEFT JOIN content c ON ca.content_id = c.id
      LEFT JOIN series s ON ca.series_id = s.id
      WHERE ca.id = actor_roles.content_actor_id
      AND (c.user_id = auth.uid() OR s.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own actor_roles" ON actor_roles FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM content_actors ca
      LEFT JOIN content c ON ca.content_id = c.id
      LEFT JOIN series s ON ca.series_id = s.id
      WHERE ca.id = actor_roles.content_actor_id
      AND (c.user_id = auth.uid() OR s.user_id = auth.uid())
    )
  );

-- reviews
CREATE POLICY "Users can view own reviews" ON reviews FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can view public reviews" ON reviews FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Users can manage own reviews" ON reviews FOR ALL 
  USING (user_id = auth.uid());

-- content_groups
CREATE POLICY "Users can view own content_groups" ON content_groups FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own content_groups" ON content_groups FOR ALL 
  USING (user_id = auth.uid());

-- content_group_items
CREATE POLICY "Users can view own content_group_items" ON content_group_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM content_groups cg
      WHERE cg.id = content_group_items.group_id
      AND cg.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own content_group_items" ON content_group_items FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM content_groups cg
      WHERE cg.id = content_group_items.group_id
      AND cg.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_actor_roles_content_actor_id ON actor_roles(content_actor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_content_id ON reviews(content_id);
CREATE INDEX IF NOT EXISTS idx_reviews_series_id ON reviews(series_id);
CREATE INDEX IF NOT EXISTS idx_content_groups_user_id ON content_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_content_group_items_group_id ON content_group_items(group_id);
CREATE INDEX IF NOT EXISTS idx_content_group_items_content_id ON content_group_items(content_id);
CREATE INDEX IF NOT EXISTS idx_content_group_items_series_id ON content_group_items(series_id);
CREATE INDEX IF NOT EXISTS idx_series_tracking_status ON series(tracking_status, user_id);