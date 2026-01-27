-- Migration: Create custom lists feature
-- Lists allow users to group content together (watchlist, favorites, custom collections, etc.)

-- Create lists table
CREATE TABLE IF NOT EXISTS public.lists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cover_image text,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create list_items table (junction table for lists and content/series)
CREATE TABLE IF NOT EXISTS public.list_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  content_id uuid REFERENCES public.content(id) ON DELETE CASCADE,
  series_id uuid REFERENCES public.series(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes text,
  CONSTRAINT list_item_type CHECK (
    (content_id IS NOT NULL AND series_id IS NULL) OR 
    (content_id IS NULL AND series_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

-- Lists policies
CREATE POLICY "Users can view their own lists"
  ON public.lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public lists"
  ON public.lists FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own lists"
  ON public.lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
  ON public.lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
  ON public.lists FOR DELETE
  USING (auth.uid() = user_id);

-- List items policies (inherit from parent list)
CREATE POLICY "Users can view items in their lists"
  ON public.list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE lists.id = list_items.list_id 
      AND (lists.user_id = auth.uid() OR lists.is_public = true)
    )
  );

CREATE POLICY "Users can insert items in their lists"
  ON public.list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE lists.id = list_items.list_id 
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their lists"
  ON public.list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE lists.id = list_items.list_id 
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their lists"
  ON public.list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE lists.id = list_items.list_id 
      AND lists.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON public.lists(user_id);
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON public.list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_content_id ON public.list_items(content_id);
CREATE INDEX IF NOT EXISTS idx_list_items_series_id ON public.list_items(series_id);
