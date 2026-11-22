/*
# Multi-user migration: user_id on profile and cvs, secure RLS

## Overview
Converts C-Vision from single-tenant to multi-user. Each student gets their own
profile and CVs. Public reference data (jobs, learning_resources, skill_gaps)
remains shared/read-only to all authenticated users.

## Modified Tables
### profile — added user_id (nullable FK to auth.users). Existing row stays NULL (orphaned, invisible via RLS).
### cvs — added user_id (nullable FK to auth.users, DEFAULT auth.uid()). Existing rows stay NULL (orphaned, invisible via RLS). New uploads auto-populate via DEFAULT auth.uid().

## Security
- profile + cvs: owner-scoped RLS (auth.uid() = user_id), authenticated only, anon revoked.
- jobs + learning_resources + skill_gaps: SELECT-only for authenticated (public reference data).
*/

-- ============================================
-- PROFILE TABLE
-- ============================================
ALTER TABLE profile ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE profile ALTER COLUMN name DROP DEFAULT;
ALTER TABLE profile ALTER COLUMN title DROP DEFAULT;
ALTER TABLE profile ALTER COLUMN cv_score DROP DEFAULT;
ALTER TABLE profile ALTER COLUMN location DROP DEFAULT;
ALTER TABLE profile ALTER COLUMN university DROP DEFAULT;
ALTER TABLE profile ALTER COLUMN graduation_year DROP DEFAULT;

DROP POLICY IF EXISTS "anon_select_profile" ON profile;
DROP POLICY IF EXISTS "anon_insert_profile" ON profile;
DROP POLICY IF EXISTS "anon_update_profile" ON profile;
DROP POLICY IF EXISTS "anon_delete_profile" ON profile;

DROP POLICY IF EXISTS "select_own_profile" ON profile;
DROP POLICY IF EXISTS "insert_own_profile" ON profile;
DROP POLICY IF EXISTS "update_own_profile" ON profile;
DROP POLICY IF EXISTS "delete_own_profile" ON profile;

REVOKE ALL ON profile FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON profile TO authenticated;

CREATE POLICY "select_own_profile" ON profile FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_profile" ON profile FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_profile" ON profile FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_profile" ON profile FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- CVS TABLE — nullable user_id with DEFAULT auth.uid()
-- ============================================
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "anon_select_cvs" ON cvs;
DROP POLICY IF EXISTS "anon_insert_cvs" ON cvs;
DROP POLICY IF EXISTS "anon_update_cvs" ON cvs;
DROP POLICY IF EXISTS "anon_delete_cvs" ON cvs;

DROP POLICY IF EXISTS "select_own_cvs" ON cvs;
DROP POLICY IF EXISTS "insert_own_cvs" ON cvs;
DROP POLICY IF EXISTS "update_own_cvs" ON cvs;
DROP POLICY IF EXISTS "delete_own_cvs" ON cvs;

REVOKE ALL ON cvs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON cvs TO authenticated;

CREATE POLICY "select_own_cvs" ON cvs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_cvs" ON cvs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_cvs" ON cvs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_cvs" ON cvs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- JOBS: read-only for authenticated
-- ============================================
DROP POLICY IF EXISTS "anon_select_jobs" ON jobs;
DROP POLICY IF EXISTS "anon_insert_jobs" ON jobs;
DROP POLICY IF EXISTS "anon_update_jobs" ON jobs;
DROP POLICY IF EXISTS "anon_delete_jobs" ON jobs;
DROP POLICY IF EXISTS "select_jobs_authenticated" ON jobs;

REVOKE ALL ON jobs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON jobs FROM authenticated;
GRANT SELECT ON jobs TO authenticated;

CREATE POLICY "select_jobs_authenticated" ON jobs FOR SELECT
  TO authenticated USING (true);

-- ============================================
-- LEARNING_RESOURCES: read-only for authenticated
-- ============================================
DROP POLICY IF EXISTS "anon_select_learning_resources" ON learning_resources;
DROP POLICY IF EXISTS "anon_insert_learning_resources" ON learning_resources;
DROP POLICY IF EXISTS "anon_update_learning_resources" ON learning_resources;
DROP POLICY IF EXISTS "anon_delete_learning_resources" ON learning_resources;
DROP POLICY IF EXISTS "select_learning_resources_authenticated" ON learning_resources;

REVOKE ALL ON learning_resources FROM anon;
REVOKE INSERT, UPDATE, DELETE ON learning_resources FROM authenticated;
GRANT SELECT ON learning_resources TO authenticated;

CREATE POLICY "select_learning_resources_authenticated" ON learning_resources FOR SELECT
  TO authenticated USING (true);

-- ============================================
-- SKILL_GAPS: read-only for authenticated
-- ============================================
DROP POLICY IF EXISTS "anon_select_skill_gaps" ON skill_gaps;
DROP POLICY IF EXISTS "anon_insert_skill_gaps" ON skill_gaps;
DROP POLICY IF EXISTS "anon_update_skill_gaps" ON skill_gaps;
DROP POLICY IF EXISTS "anon_delete_skill_gaps" ON skill_gaps;
DROP POLICY IF EXISTS "select_skill_gaps_authenticated" ON skill_gaps;

REVOKE ALL ON skill_gaps FROM anon;
REVOKE INSERT, UPDATE, DELETE ON skill_gaps FROM authenticated;
GRANT SELECT ON skill_gaps TO authenticated;

CREATE POLICY "select_skill_gaps_authenticated" ON skill_gaps FOR SELECT
  TO authenticated USING (true);
