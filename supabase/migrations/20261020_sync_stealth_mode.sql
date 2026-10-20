-- ==============================================================================
-- TAKTIC MIGRATION: INCOGNITO / STEALTH MODE CROSS-ACCOUNT SYNCHRONIZATION
-- Date: 2026-10-20
-- Purpose:
--   1. Create SECURITY DEFINER RPC `sync_my_stealth_mode` so when a user turns
--      incognito mode ON or OFF, their status immediately cascades to all circle
--      partners' roster rows in `circle_members` across the entire database.
--   2. Create SECURITY DEFINER RPC `get_circle_partners_privacy` to allow any
--      authenticated user to fetch fresh privacy/incognito settings for their
--      circle partners, bypassing any restrictive profiles RLS.
--   3. Grant UPDATE on `circle_members` where `auth.uid() = partner_user_id` so
--      partners can keep their live status in sync.
-- ==============================================================================

-- 1. Ensure circle_members has partner_user_id column
ALTER TABLE public.circle_members
  ADD COLUMN IF NOT EXISTS partner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Ensure RLS allows authenticated users to view profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Authenticated users can view profiles' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Authenticated users can view profiles"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 3. Allow users to update circle_members rows where they are the partner (for presence sync)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update partner status in circle members' AND tablename = 'circle_members'
  ) THEN
    CREATE POLICY "Users can update partner status in circle members"
      ON public.circle_members FOR UPDATE
      TO authenticated
      USING (auth.uid() = partner_user_id)
      WITH CHECK (auth.uid() = partner_user_id);
  END IF;
END $$;

-- 4. SECURITY DEFINER RPC: sync_my_stealth_mode
-- Runs with elevated permissions to cascade stealth mode across all partners' rosters
CREATE OR REPLACE FUNCTION public.sync_my_stealth_mode(
  p_is_incognito boolean,
  p_status_text text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_new_status TEXT;
  v_new_status_text TEXT;
  v_updated_count INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_is_incognito THEN
    v_new_status := 'idle';
    v_new_status_text := 'Offline';
  ELSE
    v_new_status := 'focusing';
    v_new_status_text := COALESCE(p_status_text, 'Online');
  END IF;

  -- 1. Update caller's own profiles table privacy_settings
  UPDATE public.profiles
  SET privacy_settings = jsonb_set(
    COALESCE(privacy_settings, '{}'::jsonb),
    '{isIncognito}',
    to_jsonb(p_is_incognito)
  )
  WHERE id = v_user_id;

  -- 2. Cascade status to all partners' circle_members rosters where caller is the partner
  UPDATE public.circle_members
  SET 
    status = v_new_status,
    status_text = v_new_status_text
  WHERE partner_user_id = v_user_id;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  -- 3. Also match legacy circle_members rows where partner_user_id was null
  UPDATE public.circle_members
  SET 
    status = v_new_status,
    status_text = v_new_status_text
  WHERE partner_user_id IS NULL
    AND LOWER(TRIM(member_name)) IN (
      SELECT LOWER(TRIM(full_name)) FROM public.profiles WHERE id = v_user_id AND full_name IS NOT NULL
      UNION
      SELECT LOWER(TRIM(username)) FROM public.profiles WHERE id = v_user_id AND username IS NOT NULL
      UNION
      SELECT LOWER(TRIM(email)) FROM public.profiles WHERE id = v_user_id AND email IS NOT NULL
    );

  -- 4. If stealth mode is ON, remove user from any live focus rooms
  IF p_is_incognito THEN
    DELETE FROM public.room_members WHERE user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'is_incognito', p_is_incognito,
    'roster_rows_updated', v_updated_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_my_stealth_mode(boolean, text) TO authenticated;

-- 5. SECURITY DEFINER RPC: get_circle_partners_privacy
-- Safely fetches confirmed partner privacy settings without tripping RLS
CREATE OR REPLACE FUNCTION public.get_circle_partners_privacy()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'partner_user_id', p.id,
        'full_name', p.full_name,
        'username', p.username,
        'avatar_url', p.avatar_url,
        'status_message', p.status_message,
        'current_streak', p.current_streak,
        'privacy_settings', p.privacy_settings,
        'is_incognito', COALESCE((p.privacy_settings->>'isIncognito')::boolean, false)
      )
    ),
    '[]'::jsonb
  ) INTO v_result
  FROM public.profiles p
  WHERE p.id IN (
    SELECT cm.partner_user_id 
    FROM public.circle_members cm 
    WHERE cm.user_id = v_user_id AND cm.partner_user_id IS NOT NULL
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_circle_partners_privacy() TO authenticated;
