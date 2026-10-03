-- ========================================================
-- TAKTIC CIRCLE POSTS SYNC, VISIBILITY & REALTIME PUBLICATION
-- Date: 2026-10-03
-- ========================================================

-- 1. Ensure is_private column exists on circle_posts
ALTER TABLE public.circle_posts
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false NOT NULL;

-- 2. Ensure partner_user_id exists on circle_members
ALTER TABLE public.circle_members
  ADD COLUMN IF NOT EXISTS partner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Set REPLICA IDENTITY FULL on social circle tables for reliable Supabase Realtime diffs
ALTER TABLE public.circle_posts REPLICA IDENTITY FULL;
ALTER TABLE public.circle_members REPLICA IDENTITY FULL;
ALTER TABLE public.circle_invites REPLICA IDENTITY FULL;
ALTER TABLE public.post_likes REPLICA IDENTITY FULL;

-- 4. Enable Supabase Realtime publication for circle tables if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'circle_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_posts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'circle_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'circle_invites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_invites;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'post_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
  END IF;
END $$;

-- 5. Update RLS policies on circle_posts
ALTER TABLE public.circle_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Circle posts are viewable by all authenticated users" ON public.circle_posts;
DROP POLICY IF EXISTS "Circle posts select policy" ON public.circle_posts;

CREATE POLICY "Circle posts select policy" ON public.circle_posts
  FOR SELECT
  USING (
    is_private IS NOT TRUE 
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can insert own circle posts" ON public.circle_posts;
CREATE POLICY "Users can insert own circle posts" ON public.circle_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own circle posts" ON public.circle_posts;
CREATE POLICY "Users can update own circle posts" ON public.circle_posts
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own circle posts" ON public.circle_posts;
CREATE POLICY "Users can delete own circle posts" ON public.circle_posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Grant proper permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.circle_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.circle_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.circle_invites TO authenticated;
