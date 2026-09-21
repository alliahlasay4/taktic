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
  avatar_url TEXT,
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


-- 7. Create Circle Feed Posts Table
CREATE TABLE IF NOT EXISTS public.circle_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  type TEXT DEFAULT 'ring_closed' NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Circle Posts (Readable by all authenticated users)
ALTER TABLE public.circle_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle posts are viewable by all authenticated users"
  ON public.circle_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own circle posts"
  ON public.circle_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own circle posts"
  ON public.circle_posts FOR DELETE
  USING (auth.uid() = user_id);


-- 8. Create Post Likes Table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.circle_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

CREATE POLICY "Users can delete own post likes"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);


-- 9. Create Focus Rooms Table (Private Focus Rooms & Permanent Focus Pods)
CREATE TABLE IF NOT EXISTS public.focus_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  duration_minutes INT DEFAULT 25 NOT NULL,
  is_private BOOLEAN DEFAULT true NOT NULL,
  is_permanent BOOLEAN DEFAULT false NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days') NOT NULL,
  allowed_member_ids TEXT[] DEFAULT '{}',
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


-- 10. Create Room Members Table
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.focus_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  current_goal TEXT,
  status TEXT DEFAULT 'focusing' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(room_id, user_id)
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


-- 11. Create Room Break Messages Table
CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.focus_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
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
