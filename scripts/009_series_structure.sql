-- Migration: Series structure (pre-defined seasons and episodes)
-- Allows users to create the full structure of a series before watching

-- Create series_seasons table
CREATE TABLE IF NOT EXISTS public.series_seasons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  season_number integer NOT NULL,
  name text,
  episode_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(series_id, season_number)
);

-- Create series_episodes table (pre-defined episodes, not yet watched)
CREATE TABLE IF NOT EXISTS public.series_episodes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.series_seasons(id) ON DELETE CASCADE,
  episode_number integer NOT NULL,
  name text,
  duration integer,
  is_watched boolean DEFAULT false,
  content_id uuid REFERENCES public.content(id) ON DELETE SET NULL, -- Links to actual watched content
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(season_id, episode_number)
);

-- Add total_seasons and total_episodes to series table for quick reference
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS total_seasons integer DEFAULT 0;
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS total_episodes integer DEFAULT 0;

-- Enable RLS
ALTER TABLE public.series_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_episodes ENABLE ROW LEVEL SECURITY;

-- Seasons policies
CREATE POLICY "Users can view seasons of their series"
  ON public.series_seasons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.series 
      WHERE series.id = series_seasons.series_id 
      AND series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert seasons to their series"
  ON public.series_seasons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.series 
      WHERE series.id = series_seasons.series_id 
      AND series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update seasons of their series"
  ON public.series_seasons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.series 
      WHERE series.id = series_seasons.series_id 
      AND series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete seasons from their series"
  ON public.series_seasons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.series 
      WHERE series.id = series_seasons.series_id 
      AND series.user_id = auth.uid()
    )
  );

-- Episodes policies
CREATE POLICY "Users can view episodes of their series"
  ON public.series_episodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.series 
      INNER JOIN public.series_seasons ON series.id = series_seasons.series_id
      WHERE series_seasons.id = series_episodes.season_id 
      AND series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert episodes to their series"
  ON public.series_episodes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.series 
      INNER JOIN public.series_seasons ON series.id = series_seasons.series_id
      WHERE series_seasons.id = series_episodes.season_id 
      AND series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update episodes of their series"
  ON public.series_episodes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.series 
      INNER JOIN public.series_seasons ON series.id = series_seasons.series_id
      WHERE series_seasons.id = series_episodes.season_id 
      AND series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete episodes from their series"
  ON public.series_episodes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.series 
      INNER JOIN public.series_seasons ON series.id = series_seasons.series_id
      WHERE series_seasons.id = series_episodes.season_id 
      AND series.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_series_seasons_series_id ON public.series_seasons(series_id);
CREATE INDEX IF NOT EXISTS idx_series_episodes_season_id ON public.series_episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_series_episodes_series_id ON public.series_episodes(series_id);
CREATE INDEX IF NOT EXISTS idx_series_episodes_is_watched ON public.series_episodes(is_watched);
