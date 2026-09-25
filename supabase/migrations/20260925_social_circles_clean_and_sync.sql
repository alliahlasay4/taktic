-- ========================================================
-- TAKTIC SOCIAL CIRCLES & FOCUS ROOMS FULL SYNC MIGRATION
-- Date: 2026-09-25
-- ========================================================

-- 1. Create Circle Members Table (Social Network Roster)
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

ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can select own circle members' AND tablename = 'circle_members') THEN
    CREATE POLICY "Users can select own circle members" ON public.circle_members FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own circle members' AND tablename = 'circle_members') THEN
    CREATE POLICY "Users can insert own circle members" ON public.circle_members FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own circle members' AND tablename = 'circle_members') THEN
    CREATE POLICY "Users can update own circle members" ON public.circle_members FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own circle members' AND tablename = 'circle_members') THEN
    CREATE POLICY "Users can delete own circle members" ON public.circle_members FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;


-- 2. Create Circle Invites Table
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

ALTER TABLE public.circle_invites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can select own circle invites' AND tablename = 'circle_invites') THEN
    CREATE POLICY "Users can select own circle invites" ON public.circle_invites FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own circle invites' AND tablename = 'circle_invites') THEN
    CREATE POLICY "Users can insert own circle invites" ON public.circle_invites FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own circle invites' AND tablename = 'circle_invites') THEN
    CREATE POLICY "Users can update own circle invites" ON public.circle_invites FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own circle invites' AND tablename = 'circle_invites') THEN
    CREATE POLICY "Users can delete own circle invites" ON public.circle_invites FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;


-- 3. Enhance Focus Rooms Table for Standing Pods & Long Codes
ALTER TABLE public.focus_rooms 
  ALTER COLUMN code TYPE VARCHAR(30),
  ADD COLUMN IF NOT EXISTS allowed_member_names TEXT[] DEFAULT '{}';


-- 4. Create / Update Room Members Table (Live Presence)
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

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Room members viewable by authenticated users' AND tablename = 'room_members') THEN
    CREATE POLICY "Room members viewable by authenticated users" ON public.room_members FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can join room' AND tablename = 'room_members') THEN
    CREATE POLICY "Users can join room" ON public.room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own room status' AND tablename = 'room_members') THEN
    CREATE POLICY "Users can update own room status" ON public.room_members FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can leave room' AND tablename = 'room_members') THEN
    CREATE POLICY "Users can leave room" ON public.room_members FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;


-- 5. Create / Update Room Messages Table
CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_code VARCHAR(30) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Room messages viewable by authenticated users' AND tablename = 'room_messages') THEN
    CREATE POLICY "Room messages viewable by authenticated users" ON public.room_messages FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can send room messages' AND tablename = 'room_messages') THEN
    CREATE POLICY "Users can send room messages" ON public.room_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
