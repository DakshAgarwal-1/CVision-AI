/*
# Add candidate_name column to cvs table

## Overview
Adds a `candidate_name` column to the `cvs` table so the name extracted from the
uploaded CV (PDF/TXT content) is stored and displayed separately from the account
profile name. This keeps account identity (profile.name) and CV candidate identity
(cvs.candidate_name) distinct.

## Modified Tables
1. `cvs` — new column:
   - `candidate_name` (text, nullable) — the person's name extracted from the CV
     document content. Nullable because existing rows and some CVs may not contain
     a detectable name. No NOT NULL constraint to preserve existing data.

## Security
- No new policies needed. The existing anon/authenticated CRUD policies on `cvs`
  already cover all columns. The new column inherits the same RLS protection.
- No new grants needed — the existing table-level grants cover the new column.

## Notes
1. This migration is idempotent: uses `IF NOT EXISTS`.
2. No data is lost — the column is added with a NULL default.
3. The application will populate `candidate_name` on new uploads via the
   CV parser's name-extraction logic.
*/

ALTER TABLE cvs ADD COLUMN IF NOT EXISTS candidate_name text;
