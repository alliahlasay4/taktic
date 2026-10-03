-- ========================================================
-- TAKTIC MUTUAL CIRCLE PARTNER ACCEPTANCE RPC & SCHEMA SYNC
-- Date: 2026-10-03
-- ========================================================

-- 1. Ensure partner_user_id exists on circle_members
ALTER TABLE public.circle_members
  ADD COLUMN IF NOT EXISTS partner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Ensure RLS allows selecting profiles (needed to fetch partner avatars/names)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles viewable by all' AND tablename = 'profiles') THEN
    CREATE POLICY "Public profiles viewable by all" ON public.profiles FOR SELECT USING (true);
  END IF;
END $$;

-- 2. Create the SECURITY DEFINER RPC to accept invite and mutually link partners
CREATE OR REPLACE FUNCTION public.accept_circle_invite(p_invite_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_invite RECORD;
  v_invitee_id UUID;
  v_inviter_id UUID;
  v_inviter_profile RECORD;
  v_invitee_profile RECORD;
  v_inviter_name TEXT;
  v_invitee_name TEXT;
  v_inviter_avatar TEXT;
  v_invitee_avatar TEXT;
BEGIN
  v_invitee_id := auth.uid();
  IF v_invitee_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required to accept invite');
  END IF;

  -- 1. Locate invite token
  SELECT * INTO v_invite
  FROM public.circle_invites
  WHERE invite_token = p_invite_token
  LIMIT 1;

  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation token');
  END IF;

  v_inviter_id := v_invite.user_id;

  -- Disallow accepting your own invitation
  IF v_inviter_id = v_invitee_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot accept your own invitation');
  END IF;

  -- 2. Fetch profiles for display names and avatars
  SELECT * INTO v_inviter_profile FROM public.profiles WHERE id = v_inviter_id;
  SELECT * INTO v_invitee_profile FROM public.profiles WHERE id = v_invitee_id;

  v_inviter_name := COALESCE(NULLIF(TRIM(v_inviter_profile.full_name), ''), NULLIF(TRIM(v_inviter_profile.email), ''), 'Circle Partner');
  v_invitee_name := COALESCE(NULLIF(TRIM(v_invitee_profile.full_name), ''), NULLIF(TRIM(v_invitee_profile.email), ''), NULLIF(TRIM(v_invite.name), ''), 'Circle Partner');
  
  v_inviter_avatar := COALESCE(
    v_inviter_profile.avatar_url,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );
  v_invitee_avatar := COALESCE(
    v_invitee_profile.avatar_url,
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  );

  -- 3. Upsert into Inviter's circle_members roster (adding the Invitee)
  INSERT INTO public.circle_members (
    user_id, partner_user_id, member_name, member_avatar, status, status_text, closed_rings_count, streak, is_circle_partner, is_muted
  ) VALUES (
    v_inviter_id, v_invitee_id, v_invitee_name, v_invitee_avatar, 'focusing', 'Active Partner', 0, 1, true, false
  )
  ON CONFLICT (user_id, member_name) DO UPDATE SET
    partner_user_id = EXCLUDED.partner_user_id,
    member_avatar = EXCLUDED.member_avatar,
    is_circle_partner = true;

  -- 4. Upsert into Invitee's circle_members roster (adding the Inviter)
  INSERT INTO public.circle_members (
    user_id, partner_user_id, member_name, member_avatar, status, status_text, closed_rings_count, streak, is_circle_partner, is_muted
  ) VALUES (
    v_invitee_id, v_inviter_id, v_inviter_name, v_inviter_avatar, 'focusing', 'Active Partner', 0, 1, true, false
  )
  ON CONFLICT (user_id, member_name) DO UPDATE SET
    partner_user_id = EXCLUDED.partner_user_id,
    member_avatar = EXCLUDED.member_avatar,
    is_circle_partner = true;

  -- 5. Mark invite as accepted in circle_invites
  UPDATE public.circle_invites
  SET status = 'accepted'
  WHERE id = v_invite.id;

  -- 6. Insert celebratory post in circle_posts
  INSERT INTO public.circle_posts (
    user_id, user_name, user_avatar, type, title, detail
  ) VALUES (
    v_inviter_id,
    v_inviter_name,
    v_inviter_avatar,
    'partner_connected',
    'New Circle Partner Connected! 🤝',
    v_inviter_name || ' and ' || v_invitee_name || ' are now accountability partners!'
  );

  RETURN jsonb_build_object(
    'success', true,
    'inviter_name', v_inviter_name,
    'inviter_id', v_inviter_id,
    'inviter_avatar', v_inviter_avatar
  );
END;
$$;

-- 3. Fix RLS on circle_invites so recipients can see pending invites sent to their email
DROP POLICY IF EXISTS "Users can select own circle invites" ON public.circle_invites;
DROP POLICY IF EXISTS "Users can select circle invites" ON public.circle_invites;

CREATE POLICY "Users can select circle invites" ON public.circle_invites
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    LOWER(email) = LOWER(auth.jwt()->>'email')
  );

-- 4. Function to automatically find any pending invite for the currently logged-in user
CREATE OR REPLACE FUNCTION public.get_my_pending_circle_invite()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_invite RECORD;
  v_inviter_profile RECORD;
  v_inviter_name TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_invite
  FROM public.circle_invites
  WHERE (LOWER(email) = LOWER(v_email))
    AND status = 'pending'
    AND user_id != v_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invite.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_inviter_profile FROM public.profiles WHERE id = v_invite.user_id;
  v_inviter_name := COALESCE(
    NULLIF(TRIM(v_inviter_profile.full_name), ''),
    NULLIF(TRIM(v_inviter_profile.email), ''),
    'Circle Partner'
  );

  RETURN jsonb_build_object(
    'invite_token', v_invite.invite_token,
    'inviter_name', v_inviter_name,
    'inviter_id', v_invite.user_id,
    'email', v_invite.email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_pending_circle_invite() TO authenticated;
