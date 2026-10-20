-- ========================================================
-- CIRCLE INVITES EXPIRATION, ORPHAN CLEANUP & AUTO-RESOLUTION
-- Migration Date: 2026-10-20
-- ========================================================

-- 1. Ensure circle_invites has an expires_at column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'circle_invites' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.circle_invites
      ADD COLUMN expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL;
  END IF;
END $$;

-- Backfill any existing rows where expires_at might be missing
UPDATE public.circle_invites
SET expires_at = created_at + INTERVAL '7 days'
WHERE expires_at IS NULL;

-- 2. Ensure foreign key on user_id cascades if inviter account is deleted
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'circle_invites_user_id_fkey'
  ) THEN
    ALTER TABLE public.circle_invites
      DROP CONSTRAINT IF EXISTS fk_circle_invites_user,
      ADD CONSTRAINT circle_invites_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Hardened get_my_pending_circle_invite RPC
-- - Enforces 7-day expiration
-- - Verifies inviter account still exists (cancels if inviter was deleted)
-- - Automatically marks invite as 'accepted' if both users are already circle partners
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

  -- 1. Find the newest active pending invite that has NOT expired (< 7 days old)
  SELECT * INTO v_invite
  FROM public.circle_invites
  WHERE (LOWER(email) = LOWER(v_email))
    AND status = 'pending'
    AND user_id != v_user_id
    AND (expires_at IS NULL OR expires_at > NOW())
    AND created_at > (NOW() - INTERVAL '7 days')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invite.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Check if inviter account still exists in profiles
  SELECT * INTO v_inviter_profile 
  FROM public.profiles 
  WHERE id = v_invite.user_id;

  -- If the inviter's account was deleted, cancel this orphaned invite
  IF v_inviter_profile.id IS NULL THEN
    UPDATE public.circle_invites 
    SET status = 'cancelled' 
    WHERE id = v_invite.id;
    RETURN NULL;
  END IF;

  -- 3. Check if they are ALREADY connected as circle partners
  IF EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE user_id = v_user_id AND partner_user_id = v_invite.user_id
  ) THEN
    UPDATE public.circle_invites 
    SET status = 'accepted' 
    WHERE id = v_invite.id;
    RETURN NULL;
  END IF;

  v_inviter_name := COALESCE(
    NULLIF(TRIM(v_inviter_profile.full_name), ''),
    NULLIF(TRIM(v_inviter_profile.email), ''),
    'Circle Partner'
  );

  RETURN jsonb_build_object(
    'invite_token', v_invite.invite_token,
    'inviter_name', v_inviter_name,
    'inviter_id', v_invite.user_id,
    'email', v_invite.email,
    'created_at', v_invite.created_at,
    'expires_at', v_invite.expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_pending_circle_invite() TO authenticated;

-- 4. Hardened accept_circle_invite RPC
-- - Validates token and checks status = 'pending'
-- - Checks expiration
-- - Verifies inviter profile still exists
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
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  -- Check status
  IF v_invite.status = 'accepted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has already been accepted');
  END IF;

  IF v_invite.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has been cancelled');
  END IF;

  -- Check expiration (7 days)
  IF (v_invite.expires_at IS NOT NULL AND v_invite.expires_at <= NOW()) 
     OR (v_invite.created_at < (NOW() - INTERVAL '7 days')) THEN
    UPDATE public.circle_invites SET status = 'cancelled' WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has expired');
  END IF;

  v_inviter_id := v_invite.user_id;

  -- Disallow accepting your own invitation
  IF v_inviter_id = v_invitee_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot accept your own invitation');
  END IF;

  -- 2. Fetch profiles for display names and avatars
  SELECT * INTO v_inviter_profile FROM public.profiles WHERE id = v_inviter_id;
  SELECT * INTO v_invitee_profile FROM public.profiles WHERE id = v_invitee_id;

  IF v_inviter_profile.id IS NULL THEN
    UPDATE public.circle_invites SET status = 'cancelled' WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', false, 'error', 'The user who invited you no longer has an active account');
  END IF;

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

GRANT EXECUTE ON FUNCTION public.accept_circle_invite(text) TO authenticated;
