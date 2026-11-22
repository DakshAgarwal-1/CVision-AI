/*
# Ensure safe profile defaults and per-user indexes

## Overview
Preserves all existing tables and user records while ensuring `profile` inserts
work cleanly during student signup and per-user lookups remain fast.

## Changes
1. Restore safe defaults on `profile.title` (`''`) and `profile.cv_score` (`0`)
2. Add indexes on `profile(user_id)` and `cvs(user_id)` for faster owner-scoped queries
3. Re-assert RLS enabled on all tables without modifying or deleting any existing records
*/

ALTER TABLE profile ALTER COLUMN title SET DEFAULT '';
ALTER TABLE profile ALTER COLUMN cv_score SET DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profile_user_id ON profile(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);

ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
