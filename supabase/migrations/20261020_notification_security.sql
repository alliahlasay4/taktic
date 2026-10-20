-- ==============================================================================
-- TAKTIC MIGRATION: SECURITY AUDIT SLICE 3 - NOTIFICATION HARDENING
-- Date: 2026-10-20
-- Remediates:
--   Finding #5: Unrestricted Cross-User Notification Spoofing & Injection
-- ==============================================================================

-- 1. Restrict direct INSERT on notifications table
-- Users can only insert their own local notifications directly (user_id = auth.uid())
DROP POLICY IF EXISTS "Authenticated users can create notifications for others" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure action_tab is constrained to valid application tabs
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS chk_notifications_action_tab;

ALTER TABLE public.notifications
  ADD CONSTRAINT chk_notifications_action_tab
  CHECK (action_tab IN ('dashboard', 'inbox', 'focus', 'habits', 'circles', 'analytics', 'archive', 'profile'));

-- Ensure notification type is constrained to valid types
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS chk_notifications_type;

ALTER TABLE public.notifications
  ADD CONSTRAINT chk_notifications_type
  CHECK (type IN ('timer', 'habit', 'streak', 'circle', 'system'));

-- 2. Create a secure RPC for sending partner notifications
-- Validates:
--   - Caller is authenticated
--   - Target user is an active circle partner of the caller
--   - Title and message are bounded in length
--   - Action tab is restricted to valid values
CREATE OR REPLACE FUNCTION public.send_partner_notification(
  p_target_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'circle',
  p_action_tab TEXT DEFAULT 'circles'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_is_partner BOOLEAN;
  v_clean_title TEXT;
  v_clean_message TEXT;
  v_clean_type TEXT;
  v_clean_tab TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_target_user_id IS NULL OR p_target_user_id = v_caller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid target recipient');
  END IF;

  -- 1. Verify caller and target are mutual circle partners
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE user_id = v_caller_id
      AND partner_user_id = p_target_user_id
      AND is_circle_partner = true
  ) INTO v_is_partner;

  IF NOT v_is_partner THEN
    RETURN jsonb_build_object('success', false, 'error', 'You can only send notifications to connected circle partners');
  END IF;

  -- 2. Sanitize and bound payload
  v_clean_title := SUBSTRING(TRIM(COALESCE(p_title, 'New activity')) FROM 1 FOR 100);
  v_clean_message := SUBSTRING(TRIM(COALESCE(p_message, '')) FROM 1 FOR 300);
  
  IF p_type IN ('timer', 'habit', 'streak', 'circle', 'system') THEN
    v_clean_type := p_type;
  ELSE
    v_clean_type := 'circle';
  END IF;

  IF p_action_tab IN ('dashboard', 'inbox', 'focus', 'habits', 'circles', 'analytics', 'archive', 'profile') THEN
    v_clean_tab := p_action_tab;
  ELSE
    v_clean_tab := 'circles';
  END IF;

  -- 3. Insert notification for target user
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    read,
    action_tab
  ) VALUES (
    p_target_user_id,
    v_clean_title,
    v_clean_message,
    v_clean_type,
    false,
    v_clean_tab
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_partner_notification(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
