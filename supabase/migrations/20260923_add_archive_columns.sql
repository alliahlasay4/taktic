-- ==========================================
-- MIGRATION: Add Archive Columns to Tasks
-- ==========================================
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Index for fast retrieval of active vs archived tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_archived 
ON public.tasks(user_id, archived);
