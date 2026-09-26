-- ============================================================
-- PHASE 2: SUPABASE AUTH SETUP
-- supabase/auth_setup.sql
--
-- Run this in the Supabase SQL Editor AFTER running schema.sql.
--
-- What this does:
--   1. Creates a "recruiter_profiles" table linked to Supabase Auth users
--   2. Updates RLS policies on jobs/candidates so only authenticated
--      recruiters can write (candidates can still read jobs publicly)
--   3. Creates the initial admin user setup instructions
--
-- NOTE: The actual admin user must be created in the Supabase Dashboard:
--   Authentication → Users → Add User
--   Email:    admin@luminaryhire.com
--   Password: Admin@2026
-- ============================================================

-- ── 1. RECRUITER PROFILES TABLE ──
-- Extends Supabase Auth users with role metadata
CREATE TABLE IF NOT EXISTS public.recruiter_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'recruiter' CHECK (role IN ('admin', 'recruiter')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.recruiter_profiles ENABLE ROW LEVEL SECURITY;

-- Recruiters can only see and update their own profile
CREATE POLICY "Recruiters can view own profile"
  ON public.recruiter_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Recruiters can update own profile"
  ON public.recruiter_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ── 2. AUTO-CREATE PROFILE ON SIGN-UP ──
-- When a new Auth user is created, automatically create their profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.recruiter_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'recruiter')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger fires on each new auth user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 3. UPDATED RLS POLICIES FOR AUTH ──
-- Jobs: public read, authenticated write
DROP POLICY IF EXISTS "Allow all jobs operations" ON public.jobs;

CREATE POLICY "Allow authenticated recruiters to manage jobs"
  ON public.jobs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Candidates: authenticated read/write only (sensitive data)
DROP POLICY IF EXISTS "Allow all candidate operations" ON public.candidates;

CREATE POLICY "Allow authenticated recruiters to read candidates"
  ON public.candidates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow public insert for application submissions"
  ON public.candidates
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated recruiters to update candidates"
  ON public.candidates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Applications: public insert (candidates submitting), authenticated read
DROP POLICY IF EXISTS "Allow all application operations" ON public.applications;

CREATE POLICY "Allow public application insert"
  ON public.applications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public token lookup for status page"
  ON public.applications
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated recruiters to update application status"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── 4. HELPER VIEW — Recruiter audit log ──
-- Shows all manual overrides made by recruiters
CREATE OR REPLACE VIEW public.recruiter_override_log AS
SELECT
  c.id AS candidate_id,
  c.name AS candidate_name,
  c.email AS candidate_email,
  c.job_id,
  c.job_title,
  c.ai_score,
  c.manual_override ->> 'decision' AS override_decision,
  c.manual_override ->> 'reason'   AS override_reason,
  c.manual_override ->> 'overriddenBy' AS overridden_by,
  (c.manual_override ->> 'overriddenAt')::TIMESTAMPTZ AS overridden_at
FROM public.candidates c
WHERE c.manual_override IS NOT NULL
ORDER BY (c.manual_override ->> 'overriddenAt')::TIMESTAMPTZ DESC;
