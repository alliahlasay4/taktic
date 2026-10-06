-- Migration: Mutual Circle Partner Disconnect RPC
-- Enables a user to remove a circle partner mutually (disconnecting both rosters and clearing pending invites)

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

  -- 1. Locate current user's circle_members entry
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

  IF v_target_row.id IS NOT NULL THEN
    v_partner_id := v_target_row.partner_user_id;
    v_partner_name := v_target_row.member_name;

    -- Delete current user's roster row
    DELETE FROM public.circle_members
    WHERE id = v_target_row.id;
  ELSE
    -- If no direct row was found by id, attempt deletion using provided partner parameters
    v_partner_id := p_partner_user_id;
    v_partner_name := p_partner_name;

    IF p_partner_user_id IS NOT NULL THEN
      DELETE FROM public.circle_members
      WHERE user_id = v_user_id AND partner_user_id = p_partner_user_id;
    ELSIF p_partner_name IS NOT NULL THEN
      DELETE FROM public.circle_members
      WHERE user_id = v_user_id AND LOWER(TRIM(member_name)) = LOWER(TRIM(p_partner_name));
    END IF;
  END IF;

  -- 2. Reciprocal removal: Delete current user from partner's roster
  IF v_partner_id IS NOT NULL THEN
    DELETE FROM public.circle_members
    WHERE user_id = v_partner_id AND partner_user_id = v_user_id;

    -- Also check by profile name/email in case partner_user_id was unset on their side
    SELECT * INTO v_my_profile FROM public.profiles WHERE id = v_user_id;
    IF v_my_profile.id IS NOT NULL THEN
      v_my_name := COALESCE(NULLIF(TRIM(v_my_profile.full_name), ''), NULLIF(TRIM(v_my_profile.email), ''));
      IF v_my_name IS NOT NULL THEN
        DELETE FROM public.circle_members
        WHERE user_id = v_partner_id AND LOWER(TRIM(member_name)) = LOWER(TRIM(v_my_name));
      END IF;
    END IF;
  ELSIF v_partner_name IS NOT NULL THEN
    -- If partner_user_id was null, look up partner by name/profile to clean up reciprocal record
    SELECT id INTO v_partner_id FROM public.profiles 
    WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(v_partner_name)) 
       OR LOWER(TRIM(email)) = LOWER(TRIM(v_partner_name))
    LIMIT 1;

    IF v_partner_id IS NOT NULL THEN
      DELETE FROM public.circle_members
      WHERE user_id = v_partner_id AND partner_user_id = v_user_id;

      SELECT * INTO v_my_profile FROM public.profiles WHERE id = v_user_id;
      IF v_my_profile.id IS NOT NULL THEN
        v_my_name := COALESCE(NULLIF(TRIM(v_my_profile.full_name), ''), NULLIF(TRIM(v_my_profile.email), ''));
        IF v_my_name IS NOT NULL THEN
          DELETE FROM public.circle_members
          WHERE user_id = v_partner_id AND LOWER(TRIM(member_name)) = LOWER(TRIM(v_my_name));
        END IF;
      END IF;
    END IF;
  END IF;

  -- 3. Clear any existing invites between both parties so they have a clean slate to re-invite
  IF v_partner_id IS NOT NULL THEN
    DELETE FROM public.circle_invites
    WHERE (user_id = v_user_id AND email IN (SELECT email FROM public.profiles WHERE id = v_partner_id))
       OR (user_id = v_partner_id AND email IN (SELECT email FROM public.profiles WHERE id = v_user_id));
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.disconnect_circle_partner(UUID, UUID, TEXT) TO authenticated;
