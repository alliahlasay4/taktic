-- ==========================================
-- TAKTIC SUPABASE SCHEMA & RLS SETUP SCRIPT
-- ==========================================
-- Run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  micro_goal TEXT,
  status_message TEXT,
  timezone TEXT,
  work_hours_start TEXT,
  work_hours_end TEXT,
  favorite_soundscape TEXT,
  privacy_settings JSONB DEFAULT '{
    "showFocusHours": true,
    "showMicroGoal": true,
    "showActivityFeed": true,
    "showStreak": true
  }'::jsonb,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger to auto-create profile row on auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. Create Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'wellness',
  time_of_day TEXT DEFAULT 'morning',
  target_days_per_week INT DEFAULT 7,
  freeze_shields INT DEFAULT 3,
  streak INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own habits"
  ON public.habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON public.habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON public.habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON public.habits FOR DELETE
  USING (auth.uid() = user_id);


-- 4. Create Habit Completion Logs Table
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(habit_id, completed_date)
);

-- Enable RLS on Habit Logs
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own habit logs"
  ON public.habit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit logs"
  ON public.habit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit logs"
  ON public.habit_logs FOR DELETE
  USING (auth.uid() = user_id);


-- 5. Create Focus Sessions Table
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  duration_minutes INT NOT NULL,
  task_title TEXT,
  mode TEXT DEFAULT 'pomodoro' NOT NULL,
  soundscape TEXT,
  focus_quality TEXT DEFAULT 'high_flow',
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Focus Sessions
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own focus sessions"
  ON public.focus_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus sessions"
  ON public.focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus sessions"
  ON public.focus_sessions FOR DELETE
  USING (auth.uid() = user_id);


-- 6. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' NOT NULL,
  tags TEXT[] DEFAULT '{}',
  due_date DATE,
  completed BOOLEAN DEFAULT false NOT NULL,
  is_today_focus BOOLEAN DEFAULT false NOT NULL,
  is_someday BOOLEAN DEFAULT false NOT NULL,
  recurring TEXT,
  time_block TEXT,
  estimated_minutes INT,
  completed_at TIMESTAMPTZ,
  archived BOOLEAN DEFAULT false NOT NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);


-- 7. Create Circle Members Table (Social Network Roster)
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


-- 8. Create Circle Invites Table
CREATE TABLE IF NOT EXISTS public.circle_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT,
  name TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  invite_link TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Circle Invites
ALTER TABLE public.circle_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own circle invites"
  ON public.circle_invites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own circle invites"
  ON public.circle_invites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own circle invites"
  ON public.circle_invites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own circle invites"
  ON public.circle_invites FOR DELETE
  USING (auth.uid() = user_id);


-- 9. Create Circle Feed Posts Table
CREATE TABLE IF NOT EXISTS public.circle_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  type TEXT DEFAULT 'ring_closed' NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  is_private BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Circle Posts
ALTER TABLE public.circle_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle posts select policy"
  ON public.circle_posts FOR SELECT
  USING (is_private IS NOT TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can insert own circle posts"
  ON public.circle_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own circle posts"
  ON public.circle_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own circle posts"
  ON public.circle_posts FOR DELETE
  USING (auth.uid() = user_id);


-- 10. Create Post Likes Table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.circle_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction VARCHAR(30) DEFAULT 'fire' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Enable RLS on Post Likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post likes are viewable by all authenticated users"
  ON public.post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own post likes"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own post likes"
  ON public.post_likes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own post likes"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 10b. Create Notifications Table
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

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications for others"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);


-- 11. Create Focus Rooms Table (Private Focus Rooms & Permanent Focus Pods)
CREATE TABLE IF NOT EXISTS public.focus_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(30) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  duration_minutes INT DEFAULT 25 NOT NULL,
  is_private BOOLEAN DEFAULT true NOT NULL,
  is_permanent BOOLEAN DEFAULT false NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days') NOT NULL,
  allowed_member_ids TEXT[] DEFAULT '{}',
  allowed_member_names TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Focus Rooms
ALTER TABLE public.focus_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Focus rooms viewable by authenticated users"
  ON public.focus_rooms FOR SELECT
  USING (true);

CREATE POLICY "Users can insert focus rooms"
  ON public.focus_rooms FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Room creator can update focus rooms"
  ON public.focus_rooms FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Room creator can delete focus rooms"
  ON public.focus_rooms FOR DELETE
  USING (auth.uid() = creator_id);


-- 12. Create Room Members Table (Live Presence)
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_code VARCHAR(30) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  current_goal TEXT,
  status TEXT DEFAULT 'focusing' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(room_code, user_id)
);

-- Enable RLS on Room Members
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members viewable by authenticated users"
  ON public.room_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join room"
  ON public.room_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own room status"
  ON public.room_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave room"
  ON public.room_members FOR DELETE
  USING (auth.uid() = user_id);


-- 13. Create Room Break Messages Table
CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_code VARCHAR(30) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Room Messages
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room messages viewable by authenticated users"
  ON public.room_messages FOR SELECT
  USING (true);

CREATE POLICY "Users can send room messages"
  ON public.room_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- 12. Create Quick Notes / Scratchpad Table
CREATE TABLE IF NOT EXISTS public.quick_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'slate' NOT NULL,
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Quick Notes
ALTER TABLE public.quick_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own quick notes"
  ON public.quick_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quick notes"
  ON public.quick_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quick notes"
  ON public.quick_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quick notes"
  ON public.quick_notes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quick_notes_user_pinned 
  ON public.quick_notes(user_id, is_pinned, updated_at DESC);

-- 14. Circle Partner Acceptance RPC & Realtime Sync
ALTER TABLE public.circle_members
  ADD COLUMN IF NOT EXISTS partner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

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

GRANT EXECUTE ON FUNCTION public.accept_circle_invite(text) TO authenticated;

-- 15. Create Disconnect Circle Partner RPC (Mutual Disconnect)
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

GRANT EXECUTE ON FUNCTION public.disconnect_circle_partner(UUID, UUID, TEXT) TO authenticated;

