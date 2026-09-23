-- ==========================================
-- MIGRATION: Add Quick Notes / Scratchpad Table
-- ==========================================
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run

CREATE TABLE IF NOT EXISTS public.quick_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'slate' NOT NULL,
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.quick_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Users can select own quick notes"
  ON public.quick_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quick notes"
  ON public.quick_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quick notes"
  ON public.quick_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quick notes"
  ON public.quick_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Performance index
CREATE INDEX IF NOT EXISTS idx_quick_notes_user_pinned 
  ON public.quick_notes(user_id, is_pinned, updated_at DESC);
