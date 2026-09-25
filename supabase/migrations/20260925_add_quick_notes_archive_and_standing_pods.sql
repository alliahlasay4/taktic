-- =========================================================================
-- TAKTIC PERSISTENCE FIXES: Quick Notes Archive & Standing Focus Pods
-- Date: 2026-09-25
-- =========================================================================

-- 1. Ensure Quick Notes Table has Archive Columns and Correct Indexes
ALTER TABLE public.quick_notes 
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_quick_notes_user_archived 
  ON public.quick_notes(user_id, archived, updated_at DESC);

-- 2. Ensure Focus Rooms Table Supports Standing Pods and Custom Codes
ALTER TABLE public.focus_rooms 
  ALTER COLUMN code TYPE VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  ADD COLUMN IF NOT EXISTS allowed_member_ids TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allowed_member_names TEXT[] DEFAULT '{}';

-- 3. Ensure Focus Rooms RLS allows creators full management & partners access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view accessible focus rooms' AND tablename = 'focus_rooms') THEN
    CREATE POLICY "Users can view accessible focus rooms" ON public.focus_rooms FOR SELECT USING (
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert focus rooms' AND tablename = 'focus_rooms') THEN
    CREATE POLICY "Users can insert focus rooms" ON public.focus_rooms FOR INSERT WITH CHECK (
      auth.uid() = creator_id
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own focus rooms' AND tablename = 'focus_rooms') THEN
    CREATE POLICY "Users can update own focus rooms" ON public.focus_rooms FOR UPDATE USING (
      auth.uid() = creator_id
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own focus rooms' AND tablename = 'focus_rooms') THEN
    CREATE POLICY "Users can delete own focus rooms" ON public.focus_rooms FOR DELETE USING (
      auth.uid() = creator_id
    );
  END IF;
END $$;
