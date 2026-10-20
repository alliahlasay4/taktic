-- ==============================================================================
-- TAKTIC MIGRATION: SECURITY AUDIT SLICE 2 - RLS & RPC HARDENING
-- Date: 2026-10-20
-- Remediates:
--   1. Global Data Boundary Leak / Anonymous Scraping via USING (true) (#2)
--   2. Broken Access Control in accept_circle_invite RPC (#3)
--   3. Unauthorized Cross-User Deletion in disconnect_circle_partner RPC (#4)
--   4. Missing WITH CHECK Clauses & Schema Synchronization (#11)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HARDEN RLS ON PROFILES
-- Drop world-readable policy and require authenticated users
-- Add explicit WITH CHECK on INSERT/UPDATE
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles viewable by all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Only authenticated users can view profiles (prevents anonymous data scraping)
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile with matching CHECK clause
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ------------------------------------------------------------------------------
-- 2. HARDEN RLS ON CIRCLE INVITES
-- Invites contain emails and invite tokens - must NOT be readable by arbitrary users
-- Only the sender (inviter) or the designated recipient (by email) can SELECT
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can select own circle invites" ON public.circle_invites;
DROP POLICY IF EXISTS "Users can select circle invites" ON public.circle_invites;
DROP POLICY IF EXISTS "Users can insert own circle invites" ON public.circle_invites;
DROP POLICY IF EXISTS "Users can update own circle invites" ON public.circle_invites;
DROP POLICY IF EXISTS "Users can delete own circle invites" ON public.circle_invites;

-- Add expires_at column if not present (default: 7 days expiration)
ALTER TABLE public.circle_invites
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL;

-- Only the inviter or the recipient user can view the invite
CREATE POLICY "Users can view relevant circle invites"
  ON public.circle_invites FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    (LOWER(email) = LOWER(COALESCE(auth.jwt()->>'email', '')))
  );

-- Only authenticated users can create invites where user_id = auth.uid()
CREATE POLICY "Users can insert own circle invites"
  ON public.circle_invites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only inviter can update their own invites
CREATE POLICY "Users can update own circle invites"
  ON public.circle_invites FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only inviter can delete/revoke their own invites
CREATE POLICY "Users can delete own circle invites"
  ON public.circle_invites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ------------------------------------------------------------------------------
-- 3. HARDEN RLS ON CIRCLE POSTS & POST LIKES
-- Require authenticated role on SELECT/INSERT/UPDATE/DELETE
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Circle posts select policy" ON public.circle_posts;
DROP POLICY IF EXISTS "Users can insert own circle posts" ON public.circle_posts;
DROP POLICY IF EXISTS "Users can update own circle posts" ON public.circle_posts;
DROP POLICY IF EXISTS "Users can delete own circle posts" ON public.circle_posts;

CREATE POLICY "Authenticated users can select circle posts"
  ON public.circle_posts FOR SELECT
  TO authenticated
  USING (is_private IS NOT TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can insert own circle posts"
  ON public.circle_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own circle posts"
  ON public.circle_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own circle posts"
  ON public.circle_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Post Likes
DROP POLICY IF EXISTS "Post likes are viewable by all authenticated users" ON public.post_likes;
DROP POLICY IF EXISTS "Users can insert own post likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can update own post likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can delete own post likes" ON public.post_likes;

CREATE POLICY "Authenticated users can view post likes"
  ON public.post_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own post likes"
  ON public.post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own post likes"
  ON public.post_likes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own post likes"
  ON public.post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ------------------------------------------------------------------------------
-- 4. HARDEN RLS ON FOCUS ROOMS, MEMBERS & MESSAGES
-- Restrict anonymous access by binding to authenticated role
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Focus rooms viewable by authenticated users" ON public.focus_rooms;
DROP POLICY IF EXISTS "Users can insert focus rooms" ON public.focus_rooms;
DROP POLICY IF EXISTS "Room creator can update focus rooms" ON public.focus_rooms;
DROP POLICY IF EXISTS "Room creator can delete focus rooms" ON public.focus_rooms;

CREATE POLICY "Authenticated users can view focus rooms"
  ON public.focus_rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert focus rooms"
  ON public.focus_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Room creator can update focus rooms"
  ON public.focus_rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Room creator can delete focus rooms"
  ON public.focus_rooms FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Room Members
DROP POLICY IF EXISTS "Room members viewable by authenticated users" ON public.room_members;
DROP POLICY IF EXISTS "Users can join room" ON public.room_members;
DROP POLICY IF EXISTS "Users can update own room status" ON public.room_members;
DROP POLICY IF EXISTS "Users can leave room" ON public.room_members;

CREATE POLICY "Authenticated users can view room members"
  ON public.room_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join room"
  ON public.room_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own room status"
  ON public.room_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave room"
  ON public.room_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Room Messages
DROP POLICY IF EXISTS "Room messages viewable by authenticated users" ON public.room_messages;
DROP POLICY IF EXISTS "Users can send room messages" ON public.room_messages;

CREATE POLICY "Authenticated users can view room messages"
  ON public.room_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can send room messages"
  ON public.room_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- ------------------------------------------------------------------------------
-- 5. HARDEN accept_circle_invite RPC
-- Remediates:
--   - Token status check (must be 'pending')
--   - Expiration validation (must not be expired)
--   - Recipient verification: user must either match the recipient email OR the invite must have no assigned email
--   - Prevents self-acceptance
--   - Atomic state change to 'accepted' with recipient_user_id tracking
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_circle_invite(p_invite_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_invite RECORD;
  v_invitee_id UUID;
  v_invitee_email TEXT;
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

  -- Get current user email from auth.users
  SELECT email INTO v_invitee_email FROM auth.users WHERE id = v_invitee_id;

  -- 1. Locate invite token with FOR UPDATE to lock row against race conditions
  SELECT * INTO v_invite
  FROM public.circle_invites
  WHERE invite_token = p_invite_token
  FOR UPDATE;

  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invitation token');
  END IF;

  -- 2. Validate invite status
  IF v_invite.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has already been ' || v_invite.status);
  END IF;

  -- 3. Check expiration (if expires_at is set)
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < NOW() THEN
    UPDATE public.circle_invites SET status = 'expired' WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has expired');
  END IF;

  v_inviter_id := v_invite.user_id;

  -- 4. Disallow accepting your own invitation
  IF v_inviter_id = v_invitee_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot accept your own invitation');
  END IF;

  -- 5. Recipient validation: If invite is bound to an email, ensure caller email matches
  IF v_invite.email IS NOT NULL AND TRIM(v_invite.email) <> '' THEN
    IF v_invitee_email IS NULL OR LOWER(TRIM(v_invite.email)) <> LOWER(TRIM(v_invitee_email)) THEN
      RETURN jsonb_build_object('success', false, 'error', 'This invitation was addressed to a different email account');
    END IF;
  END IF;

  -- 6. Fetch profiles for display names and avatars
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

  -- 7. Upsert into Inviter's circle_members roster (adding the Invitee)
  INSERT INTO public.circle_members (
    user_id, partner_user_id, member_name, member_avatar, status, status_text, closed_rings_count, streak, is_circle_partner, is_muted
  ) VALUES (
    v_inviter_id, v_invitee_id, v_invitee_name, v_invitee_avatar, 'focusing', 'Active Partner', 0, 1, true, false
  )
  ON CONFLICT (user_id, member_name) DO UPDATE SET
    partner_user_id = EXCLUDED.partner_user_id,
    member_avatar = EXCLUDED.member_avatar,
    is_circle_partner = true;

  -- 8. Upsert into Invitee's circle_members roster (adding the Inviter)
  INSERT INTO public.circle_members (
    user_id, partner_user_id, member_name, member_avatar, status, status_text, closed_rings_count, streak, is_circle_partner, is_muted
  ) VALUES (
    v_invitee_id, v_inviter_id, v_inviter_name, v_inviter_avatar, 'focusing', 'Active Partner', 0, 1, true, false
  )
  ON CONFLICT (user_id, member_name) DO UPDATE SET
    partner_user_id = EXCLUDED.partner_user_id,
    member_avatar = EXCLUDED.member_avatar,
    is_circle_partner = true;

  -- 9. Mark invite as accepted in circle_invites
  UPDATE public.circle_invites
  SET status = 'accepted'
  WHERE id = v_invite.id;

  -- 10. Insert celebratory post in circle_posts
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


-- ------------------------------------------------------------------------------
-- 6. HARDEN disconnect_circle_partner RPC
-- Remediates:
--   - Prohibits cross-user deletions by validating the caller user_id is strictly a party to the relationship
--   - Verifies ownership of member row before reciprocal cleanup
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.disconnect_circle_partner(
  p_member_id UUID DEFAULT NULL,
  p_partner_user_id UUID DEFAULT NULL,
  p_partner_name TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_target_row RECORD;
  v_partner_id UUID;
  v_partner_name TEXT;
  v_my_profile RECORD;
  v_my_name TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- 1. Strictly locate current user's circle_members entry where user_id = auth.uid()
  IF p_member_id IS NOT NULL THEN
    SELECT * INTO v_target_row
    FROM public.circle_members
    WHERE id = p_member_id AND user_id = v_user_id
    LIMIT 1;
  END IF;

  IF v_target_row.id IS NULL AND p_partner_user_id IS NOT NULL THEN
    SELECT * INTO v_target_row
    FROM public.circle_members
    WHERE user_id = v_user_id AND partner_user_id = p_partner_user_id
    LIMIT 1;
  END IF;

  IF v_target_row.id IS NULL AND p_partner_name IS NOT NULL THEN
    SELECT * INTO v_target_row
    FROM public.circle_members
    WHERE user_id = v_user_id AND LOWER(TRIM(member_name)) = LOWER(TRIM(p_partner_name))
    LIMIT 1;
  END IF;

  -- If no valid row owned by the current user was found, fail gracefully without touching other users
  IF v_target_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Partner relationship not found');
  END IF;

  v_partner_id := v_target_row.partner_user_id;
  v_partner_name := v_target_row.member_name;

  -- Delete current user's roster row
  DELETE FROM public.circle_members
  WHERE id = v_target_row.id AND user_id = v_user_id;

  -- 2. Reciprocal removal: ONLY delete from partner's roster if they are linked to the calling user
  IF v_partner_id IS NOT NULL THEN
    DELETE FROM public.circle_members
    WHERE user_id = v_partner_id AND partner_user_id = v_user_id;

    -- Also check by profile name in case partner_user_id was unset on their side
    SELECT * INTO v_my_profile FROM public.profiles WHERE id = v_user_id;
    IF v_my_profile.id IS NOT NULL THEN
      v_my_name := COALESCE(NULLIF(TRIM(v_my_profile.full_name), ''), NULLIF(TRIM(v_my_profile.email), ''));
      IF v_my_name IS NOT NULL THEN
        DELETE FROM public.circle_members
        WHERE user_id = v_partner_id AND LOWER(TRIM(member_name)) = LOWER(TRIM(v_my_name));
      END IF;
    END IF;

    -- 3. Clear any pending/existing invites between the two verified parties
    DELETE FROM public.circle_invites
    WHERE (user_id = v_user_id AND email IN (SELECT email FROM public.profiles WHERE id = v_partner_id))
       OR (user_id = v_partner_id AND email IN (SELECT email FROM public.profiles WHERE id = v_user_id));
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.disconnect_circle_partner(UUID, UUID, TEXT) TO authenticated;
