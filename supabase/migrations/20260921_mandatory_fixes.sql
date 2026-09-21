-- ==========================================
-- TAKTIC MANDATORY FIXES MIGRATION
-- Date: 2026-09-21
-- ==========================================

-- 1. Add missing focus_quality column to focus_sessions
ALTER TABLE public.focus_sessions 
ADD COLUMN IF NOT EXISTS focus_quality TEXT DEFAULT 'high_flow';

-- 2. Add streak & onboarding tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 3. Create Circle Members Table for social network persistence
CREATE TABLE IF NOT EXISTS public.circle_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_name TEXT NOT NULL,
  member_avatar TEXT,
  status TEXT DEFAULT 'focusing' NOT NULL,
  status_text TEXT,
  closed_rings_count INT DEFAULT 0,
  streak INT DEFAULT 1,
  is_circle_partner BOOLEAN DEFAULT true,
  is_muted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, member_name)
);

-- Enable RLS on Circle Members
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own circle members"
  ON public.circle_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own circle members"
  ON public.circle_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own circle members"
  ON public.circle_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own circle members"
  ON public.circle_members FOR DELETE
  USING (auth.uid() = user_id);
