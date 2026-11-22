/*
# CVision Core Schema (Multi-User)

## Overview
Creates the complete database schema for CVision, an AI-powered CV analysis and
job matching platform. This is a multi-user app with Supabase Authentication —
each authenticated student has their own profile and CVs. Job listings, skill
gaps, and learning resources are shared public reference data (read-only).

## New Tables
1. `profile` — per-user profile (name, title, avatar, cv_score, etc.) linked via user_id
2. `cvs` — uploaded CVs (filename, raw text, parsed skills, score, candidate_name) linked via user_id
3. `jobs` — job listings (title, company, location, required_skills, match_score, etc.) — shared
4. `skill_gaps` — skill gap analysis (skill name, current level, target level, priority) — shared
5. `learning_resources` — recommended learning resources (title, skill, type, url, duration) — shared

## Security
- RLS enabled on all tables.
- profile + cvs: owner-scoped (auth.uid() = user_id), authenticated only, anon revoked.
- jobs + skill_gaps + learning_resources: SELECT-only for authenticated (public reference data).
*/

-- ============================================
-- PROFILE TABLE (per-user)
-- ============================================
CREATE TABLE IF NOT EXISTS profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text NOT NULL DEFAULT '',
  avatar_url text,
  cv_score integer NOT NULL DEFAULT 0,
  bio text,
  email text,
  phone text,
  location text,
  university text,
  graduation_year integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profile ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON profile TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profile;
CREATE POLICY "select_own_profile" ON profile FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profile;
CREATE POLICY "insert_own_profile" ON profile FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profile;
CREATE POLICY "update_own_profile" ON profile FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON profile;
CREATE POLICY "delete_own_profile" ON profile FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- CVS TABLE (per-user)
-- ============================================
CREATE TABLE IF NOT EXISTS cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_size bigint DEFAULT 0,
  raw_text text,
  parsed_skills text[] DEFAULT '{}',
  experience_years numeric DEFAULT 0,
  education text,
  score integer DEFAULT 0,
  status text DEFAULT 'analyzed',
  candidate_name text,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON cvs TO authenticated;

DROP POLICY IF EXISTS "select_own_cvs" ON cvs;
CREATE POLICY "select_own_cvs" ON cvs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cvs" ON cvs;
CREATE POLICY "insert_own_cvs" ON cvs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cvs" ON cvs;
CREATE POLICY "update_own_cvs" ON cvs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cvs" ON cvs;
CREATE POLICY "delete_own_cvs" ON cvs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- JOBS TABLE (shared, read-only)
-- ============================================
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  location text DEFAULT 'Remote',
  job_type text DEFAULT 'Full-time',
  experience_level text DEFAULT 'Entry',
  salary_range text,
  description text,
  required_skills text[] NOT NULL DEFAULT '{}',
  missing_skills text[] DEFAULT '{}',
  matched_skills text[] DEFAULT '{}',
  match_score integer NOT NULL DEFAULT 0,
  match_strength text DEFAULT 'moderate',
  posted_date timestamptz DEFAULT now(),
  is_remote boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON jobs TO authenticated;

DROP POLICY IF EXISTS "select_jobs_authenticated" ON jobs;
CREATE POLICY "select_jobs_authenticated" ON jobs FOR SELECT
  TO authenticated USING (true);

-- ============================================
-- SKILL_GAPS TABLE (shared, read-only)
-- ============================================
CREATE TABLE IF NOT EXISTS skill_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name text NOT NULL,
  current_level integer NOT NULL DEFAULT 0,
  target_level integer NOT NULL DEFAULT 100,
  priority text NOT NULL DEFAULT 'low',
  category text DEFAULT 'technical',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skill_gaps ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON skill_gaps TO authenticated;

DROP POLICY IF EXISTS "select_skill_gaps_authenticated" ON skill_gaps;
CREATE POLICY "select_skill_gaps_authenticated" ON skill_gaps FOR SELECT
  TO authenticated USING (true);

-- ============================================
-- LEARNING_RESOURCES TABLE (shared, read-only)
-- ============================================
CREATE TABLE IF NOT EXISTS learning_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name text NOT NULL,
  title text NOT NULL,
  provider text DEFAULT 'Coursera',
  resource_type text DEFAULT 'course',
  url text,
  duration_hours numeric DEFAULT 10,
  difficulty text DEFAULT 'intermediate',
  rating numeric DEFAULT 4.5,
  priority text DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON learning_resources TO authenticated;

DROP POLICY IF EXISTS "select_learning_resources_authenticated" ON learning_resources;
CREATE POLICY "select_learning_resources_authenticated" ON learning_resources FOR SELECT
  TO authenticated USING (true);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_jobs_match_score ON jobs(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_cvs_uploaded_at ON cvs(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_priority ON skill_gaps(priority);
