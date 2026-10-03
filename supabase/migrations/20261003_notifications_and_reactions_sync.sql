-- Migration: Fix post reactions synchronization, add reactions column/policies, and create notifications table with realtime
-- Run this migration in Supabase SQL Editor

-- 1. Ensure reaction column exists on public.post_likes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'post_likes' 
    AND column_name = 'reaction'
  ) THEN
    ALTER TABLE public.post_likes ADD COLUMN reaction VARCHAR(30) DEFAULT 'fire' NOT NULL;
  END IF;
END $$;

-- 2. Enable RLS on post_likes and establish complete policies (SELECT, INSERT, UPDATE, DELETE)
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Post likes are viewable by all authenticated users" ON public.post_likes;
CREATE POLICY "Post likes are viewable by all authenticated users"
  ON public.post_likes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own post likes" ON public.post_likes;
CREATE POLICY "Users can insert own post likes"
  ON public.post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own post likes" ON public.post_likes;
CREATE POLICY "Users can update own post likes"
  ON public.post_likes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own post likes" ON public.post_likes;
CREATE POLICY "Users can delete own post likes"
  ON public.post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Create Notifications Table for in-app alert sync
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'circle' NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  action_tab VARCHAR(30) DEFAULT 'circles',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast user notification lookup
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Enable RLS on Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create notifications for others" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications for others"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Enable REPLICA IDENTITY FULL for Realtime change payloads
ALTER TABLE public.post_likes REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 5. Add tables to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'post_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 6. Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
