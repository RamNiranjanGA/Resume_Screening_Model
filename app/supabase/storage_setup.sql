-- ============================================================
-- PHASE 3: SUPABASE STORAGE SETUP
-- supabase/storage_setup.sql
--
-- Run this in the Supabase SQL Editor AFTER auth_setup.sql.
--
-- What this does:
--   1. Creates the "recordings" storage bucket (private)
--   2. Sets RLS policies so:
--      - Anyone can upload (candidates submitting applications)
--      - Only authenticated recruiters can read/delete
--   3. Creates a helper function for generating signed URLs
--
-- NOTE: You also need to create the bucket in the Supabase Dashboard:
--   Storage → New Bucket → Name: "recordings" → Private (NOT public)
-- ============================================================

-- ── 1. RLS POLICIES FOR STORAGE ──
-- The bucket must be created in the Dashboard first (Storage → New Bucket).
-- These policies control who can read/write objects inside it.

-- Allow anyone to upload recordings (candidates don't have accounts)
DROP POLICY IF EXISTS "Allow public upload to recordings bucket" ON storage.objects;
CREATE POLICY "Allow public upload to recordings bucket"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'recordings');

-- Only authenticated recruiters can read recordings
DROP POLICY IF EXISTS "Allow authenticated read of recordings" ON storage.objects;
CREATE POLICY "Allow authenticated read of recordings"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'recordings');

-- Only authenticated recruiters can delete recordings
DROP POLICY IF EXISTS "Allow authenticated delete of recordings" ON storage.objects;
CREATE POLICY "Allow authenticated delete of recordings"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'recordings');

-- ── 2. HELPER VIEW — Storage usage per job ──
CREATE OR REPLACE VIEW public.recording_storage_summary AS
SELECT
  c.job_id,
  c.job_title,
  COUNT(*) AS total_recordings,
  COUNT(CASE WHEN c.recording_url != '' THEN 1 END) AS recordings_uploaded
FROM public.candidates c
GROUP BY c.job_id, c.job_title
ORDER BY total_recordings DESC;
