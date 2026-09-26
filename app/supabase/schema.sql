-- ============================================================
-- LUMINARYHIRE — SUPABASE DATABASE SCHEMA
-- Phase 1: Database Setup
--
-- This script creates the core tables, indexes, row-level security
-- (RLS) policies, and initial seed data for the LuminaryHire
-- AI Video Resume Screening platform.
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('full-time', 'part-time', 'contract', 'remote', 'hybrid')),
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  responsibilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  must_have_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  salary TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  applicant_count INT NOT NULL DEFAULT 0,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. CANDIDATES TABLE
CREATE TABLE IF NOT EXISTS public.candidates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  job_id TEXT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'decided', 'expired')),
  decision TEXT NOT NULL DEFAULT 'pending' CHECK (decision IN ('selected', 'not_selected', 'pending', 'manual_review')),
  ai_score INT NOT NULL DEFAULT 0 CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_reasoning TEXT NOT NULL DEFAULT '',
  transcript TEXT NOT NULL DEFAULT '',
  recording_url TEXT NOT NULL DEFAULT '',
  manual_override JSONB DEFAULT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. APPLICATIONS TABLE (Token-based candidate application tracking)
CREATE TABLE IF NOT EXISTS public.applications (
  token TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  candidate_id TEXT REFERENCES public.candidates(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'decided', 'expired')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON public.candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_decision ON public.candidates(decision);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON public.applications(candidate_id);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Allow public read of published jobs
CREATE POLICY "Allow public read of published jobs"
  ON public.jobs
  FOR SELECT
  USING (status = 'published');

-- Allow all operations for jobs during development/admin use
CREATE POLICY "Allow all jobs operations"
  ON public.jobs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow public read & write of candidates for screening workflows
CREATE POLICY "Allow all candidate operations"
  ON public.candidates
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow public read & write of applications for token status checks
CREATE POLICY "Allow all application operations"
  ON public.applications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. SEED DATA — Open Jobs
INSERT INTO public.jobs (
  id, title, company, department, location, type, summary, description,
  responsibilities, requirements, must_have_skills, salary, status, applicant_count, posted_at
) VALUES
(
  'job-001',
  'Senior Frontend Engineer',
  'Luminary Labs',
  'Engineering',
  'Bengaluru, Karnataka',
  'hybrid',
  'Build beautiful, performant web apps for millions of users across India.',
  'We''re looking for a passionate Senior Frontend Engineer to join our growing product team in Bengaluru. You''ll work closely with design and backend to create seamless, high-impact user experiences across our core platform.',
  '["Architect and build scalable React/Next.js applications", "Collaborate with designers to implement pixel-perfect UIs", "Lead code reviews and mentor junior engineers", "Optimise performance and ensure mobile-first responsiveness", "Contribute to our design system and component library"]'::jsonb,
  '["5+ years of frontend experience with React", "Strong TypeScript skills", "Experience with Next.js and SSR/SSG patterns", "Familiarity with testing (Jest, Playwright)", "Excellent communication and collaboration skills"]'::jsonb,
  '["React", "TypeScript", "Next.js", "CSS-in-JS"]'::jsonb,
  '₹28 – 42 LPA',
  'published',
  34,
  '2026-09-10T08:00:00Z'
),
(
  'job-002',
  'Product Designer',
  'Luminary Labs',
  'Design',
  'Mumbai, Maharashtra',
  'remote',
  'Shape the visual identity and UX of a fast-growing platform — work from anywhere in India.',
  'As our Product Designer, you''ll own the end-to-end design process — from user research and wireframing to high-fidelity prototypes and design system maintenance. Base office is in Mumbai; fully remote-friendly role within India.',
  '["Lead UX research sessions and synthesise insights into designs", "Create wireframes, prototypes, and high-fidelity Figma designs", "Maintain and evolve the product design system", "Collaborate with PMs and engineers throughout the product lifecycle", "Run A/B tests and iterate on data-driven feedback"]'::jsonb,
  '["4+ years of product design experience", "Expert-level Figma skills", "Strong portfolio showcasing shipped products", "Experience with design systems", "User research experience"]'::jsonb,
  '["Figma", "User Research", "Prototyping", "Design Systems"]'::jsonb,
  '₹22 – 35 LPA',
  'published',
  51,
  '2026-09-12T08:00:00Z'
),
(
  'job-003',
  'AI / ML Engineer',
  'Luminary Labs',
  'AI Research',
  'Hyderabad, Telangana',
  'hybrid',
  'Build intelligent systems that power our AI-matching core engine.',
  'Join our AI team in Hyderabad to build and deploy machine learning models that power Luminary''s hiring intelligence platform. You''ll work on NLP, audio/video analysis, and real-time scoring systems.',
  '["Design and train NLP models for transcript analysis", "Build audio/video feature extraction pipelines", "Deploy and monitor ML models in production", "Research and evaluate state-of-the-art approaches", "Collaborate with product to define AI-driven features"]'::jsonb,
  '["3+ years ML/AI engineering experience", "Strong Python skills (PyTorch or TensorFlow)", "Experience deploying ML models to production", "Knowledge of NLP and speech processing", "Familiarity with cloud ML platforms (AWS/GCP)"]'::jsonb,
  '["Python", "PyTorch", "NLP", "MLOps"]'::jsonb,
  '₹32 – 55 LPA',
  'published',
  22,
  '2026-09-14T08:00:00Z'
),
(
  'job-004',
  'Growth Marketing Manager',
  'Luminary Labs',
  'Marketing',
  'Gurugram, Haryana',
  'hybrid',
  'Drive user acquisition and retention across all digital marketing channels.',
  'We''re looking for a data-driven Growth Marketing Manager to own our acquisition strategy, run experiments, and scale our pipeline from our Gurugram hub. You''ll partner with the product and sales teams directly.',
  '["Own growth strategy across paid, organic, and partner channels", "Run rapid A/B experiments across landing pages, ads, and email", "Analyse funnel metrics and identify conversion opportunities", "Collaborate with content, design, and product teams", "Report growth KPIs to leadership weekly"]'::jsonb,
  '["4+ years in growth or performance marketing", "Strong analytical skills (SQL, Mixpanel, or Amplitude)", "Experience with paid acquisition (Google, Meta, LinkedIn)", "Excellent written communication in English and Hindi", "SaaS or B2B marketing experience preferred"]'::jsonb,
  '["Growth Strategy", "Analytics", "Paid Acquisition", "A/B Testing"]'::jsonb,
  '₹18 – 28 LPA',
  'published',
  18,
  '2026-09-15T08:00:00Z'
),
(
  'job-005',
  'Backend Engineer (Node.js)',
  'Luminary Labs',
  'Engineering',
  'Pune, Maharashtra',
  'remote',
  'Build reliable, scalable APIs powering our core platform — remote within India.',
  'As a Backend Engineer, you''ll design and implement APIs, microservices, and data pipelines for our hiring intelligence platform. Office base is Pune; role is fully remote within India. You''ll work on systems processing thousands of real-time video submissions daily.',
  '["Design and build RESTful/GraphQL APIs in Node.js/TypeScript", "Architect scalable microservices and data pipelines", "Build and maintain CI/CD pipelines", "Ensure system reliability, observability, and security", "Mentor junior engineers and lead backend architecture decisions"]'::jsonb,
  '["5+ years backend engineering with Node.js", "Strong SQL and NoSQL database knowledge", "Experience with AWS or GCP", "Familiarity with message queues (Kafka, SQS)", "Security-first mindset"]'::jsonb,
  '["Node.js", "TypeScript", "PostgreSQL", "AWS"]'::jsonb,
  '₹24 – 38 LPA',
  'published',
  29,
  '2026-09-16T08:00:00Z'
),
(
  'job-006',
  'Customer Success Manager',
  'Luminary Labs',
  'Customer Success',
  'Chennai, Tamil Nadu',
  'hybrid',
  'Be the voice of our customers and drive long-term retention across South India.',
  'Our Customer Success team is the bridge between our product and our clients. As a CSM based in Chennai, you''ll own the onboarding, adoption, and renewal journey for a portfolio of mid-market and enterprise clients across the South India region.',
  '["Own a portfolio of 30–50 enterprise accounts in South India", "Lead onboarding and training for new clients", "Monitor usage metrics and proactively address churn risks", "Conduct QBRs and executive business reviews", "Gather product feedback and relay to the product team"]'::jsonb,
  '["3+ years in Customer Success or Account Management", "Experience with B2B SaaS platforms", "Strong data literacy (Salesforce, Gainsight, or similar)", "Excellent presentation and communication skills (English + Tamil preferred)", "Ability to manage multiple priorities in a fast-paced environment"]'::jsonb,
  '["Account Management", "Salesforce", "QBR Preparation", "Churn Prevention"]'::jsonb,
  '₹15 – 22 LPA',
  'published',
  12,
  '2026-09-17T08:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  company = EXCLUDED.company,
  department = EXCLUDED.department,
  location = EXCLUDED.location,
  type = EXCLUDED.type,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  responsibilities = EXCLUDED.responsibilities,
  requirements = EXCLUDED.requirements,
  must_have_skills = EXCLUDED.must_have_skills,
  salary = EXCLUDED.salary,
  status = EXCLUDED.status,
  applicant_count = EXCLUDED.applicant_count,
  posted_at = EXCLUDED.posted_at;

-- 8. SEED DATA — Candidates
INSERT INTO public.candidates (
  id, name, email, job_id, job_title, submitted_at, status, decision, ai_score, ai_reasoning, transcript, recording_url
) VALUES
(
  'cand-001',
  'Priya Sharma',
  'priya.sharma@email.com',
  'job-001',
  'Senior Frontend Engineer',
  '2026-09-16T14:32:00Z',
  'decided',
  'selected',
  91,
  'Strong alignment with React and TypeScript requirements. Candidate demonstrated clear understanding of performance optimisation and design system architecture. Communication was articulate and confident. Exceeds expectations on all must-have skills.',
  'Hi, I''m Priya. I''ve spent the last 6 years building frontend systems at scale — most recently at Razorpay in Bengaluru, where I led the migration of our checkout UI to Next.js. I''m deeply passionate about performance and design systems. I led a project that cut our LCP by 40% and reduced bundle size by 35%. I work closely with designers to ensure pixel-perfect implementations, and I''ve mentored 3 junior engineers over the past year. I''m excited about the opportunity at Luminary because I believe AI-driven hiring can genuinely make the process fairer. I''d love to bring my experience building high-impact, user-centric products to your team.',
  '/recordings/cand-001.mp4'
),
(
  'cand-002',
  'Arjun Mehta',
  'arjun.mehta@email.com',
  'job-001',
  'Senior Frontend Engineer',
  '2026-09-16T16:45:00Z',
  'decided',
  'not_selected',
  48,
  'Candidate has some frontend experience but lacks depth in TypeScript and Next.js — both marked as must-have skills. Did not mention experience with design systems or mentorship. Communication was unclear in places. Score reflects significant gaps in required technical skills.',
  'Hey, I''m Arjun. I''ve been doing frontend work for about 2 years, mostly with Vue and some React on smaller projects. I haven''t used TypeScript much but I''m willing to learn. I''ve done some CSS and basic JavaScript. I like building things that look good. I think I could grow into this role with some time and guidance.',
  '/recordings/cand-002.mp4'
),
(
  'cand-003',
  'Kavitha Nair',
  'kavitha.nair@email.com',
  'job-002',
  'Product Designer',
  '2026-09-17T09:15:00Z',
  'decided',
  'manual_review',
  74,
  'Candidate shows strong Figma skills and good design sensibility. Mentioned user research experience but did not elaborate on methodology. Design system experience is implied but not confirmed. Score falls in the borderline zone — recommending manual human review to assess portfolio depth.',
  'Hello, I''m Kavitha. I''ve been a product designer for 5 years, working at both agencies and startups across Mumbai. My Figma skills are advanced — I''ve built two design systems from scratch for fintech products. I love the research side of design, especially usability testing. I''ve worked on consumer apps with millions of users. I''m drawn to Luminary because I want to work on a product that has real social impact. I believe good design can remove bias in hiring, which is something I care about deeply.',
  '/recordings/cand-003.mp4'
),
(
  'cand-004',
  'Aditya Rao',
  'aditya.rao@email.com',
  'job-003',
  'AI / ML Engineer',
  '2026-09-17T11:00:00Z',
  'processing',
  'pending',
  0,
  '',
  '',
  '/recordings/cand-004.mp4'
),
(
  'cand-005',
  'Sneha Kulkarni',
  'sneha.kulkarni@email.com',
  'job-001',
  'Senior Frontend Engineer',
  '2026-09-18T07:20:00Z',
  'received',
  'pending',
  0,
  '',
  '',
  '/recordings/cand-005.mp4'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  job_id = EXCLUDED.job_id,
  job_title = EXCLUDED.job_title,
  submitted_at = EXCLUDED.submitted_at,
  status = EXCLUDED.status,
  decision = EXCLUDED.decision,
  ai_score = EXCLUDED.ai_score,
  ai_reasoning = EXCLUDED.ai_reasoning,
  transcript = EXCLUDED.transcript,
  recording_url = EXCLUDED.recording_url;

-- 9. SEED DATA — Applications (Tokens for status / results)
INSERT INTO public.applications (
  token, job_id, job_title, candidate_id, candidate_name, candidate_email, status, submitted_at
) VALUES
(
  'tok-001',
  'job-001',
  'Senior Frontend Engineer',
  'cand-001',
  'Priya Sharma',
  'priya.sharma@email.com',
  'decided',
  '2026-09-16T14:32:00Z'
),
(
  'tok-002',
  'job-001',
  'Senior Frontend Engineer',
  'cand-002',
  'Arjun Mehta',
  'arjun.mehta@email.com',
  'decided',
  '2026-09-16T16:45:00Z'
),
(
  'tok-003',
  'job-002',
  'Product Designer',
  'cand-003',
  'Kavitha Nair',
  'kavitha.nair@email.com',
  'decided',
  '2026-09-17T09:15:00Z'
),
(
  'tok-004',
  'job-003',
  'AI / ML Engineer',
  'cand-004',
  'Aditya Rao',
  'aditya.rao@email.com',
  'processing',
  '2026-09-17T11:00:00Z'
),
(
  'tok-005',
  'job-001',
  'Senior Frontend Engineer',
  'cand-005',
  'Sneha Kulkarni',
  'sneha.kulkarni@email.com',
  'received',
  '2026-09-18T07:20:00Z'
)
ON CONFLICT (token) DO UPDATE SET
  job_id = EXCLUDED.job_id,
  job_title = EXCLUDED.job_title,
  candidate_id = EXCLUDED.candidate_id,
  candidate_name = EXCLUDED.candidate_name,
  candidate_email = EXCLUDED.candidate_email,
  status = EXCLUDED.status,
  submitted_at = EXCLUDED.submitted_at;
