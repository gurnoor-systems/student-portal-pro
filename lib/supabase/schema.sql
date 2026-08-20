-- ==============================================================================
-- Student Portal Pro - PostgreSQL & Supabase Row-Level Security (RLS) Schema
-- ==============================================================================

-- 1. Profiles Table (Multi-tenant User Scoping)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  university TEXT,
  major TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile only" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile only" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  instructor TEXT,
  meeting_link TEXT,
  meeting_platform TEXT, -- 'meet' | 'zoom' | 'teams'
  schedule_time TEXT,
  color_tag TEXT DEFAULT '#1c69d4',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own courses only" 
  ON public.courses FOR ALL 
  USING (auth.uid() = user_id);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('todo', 'in_progress', 'completed')) DEFAULT 'todo',
  category TEXT DEFAULT 'Assignment',
  google_calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks only" 
  ON public.tasks FOR ALL 
  USING (auth.uid() = user_id);

-- 4. Exams Table (Chronological Assessment Tracking)
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  exam_date TIMESTAMPTZ NOT NULL,
  weight_percent INTEGER DEFAULT 25,
  location_or_platform TEXT,
  topics_covered JSONB DEFAULT '[]'::jsonb,
  readiness_percent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own exams only" 
  ON public.exams FOR ALL 
  USING (auth.uid() = user_id);

-- 5. Course Materials & Custom Folders
CREATE TABLE IF NOT EXISTS public.material_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  folder_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.material_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own folders only" 
  ON public.material_folders FOR ALL 
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.course_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES public.material_folders(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT DEFAULT 0,
  file_type TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own materials only" 
  ON public.course_materials FOR ALL 
  USING (auth.uid() = user_id);
