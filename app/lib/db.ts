// ============================================================
// DATABASE ACCESS LAYER (Supabase + Resilient Fallback)
// ============================================================

import { supabase } from './supabase';
import { Job, Candidate, ApplicationSubmission } from './types';
import { MOCK_JOBS, MOCK_CANDIDATES } from './mock-data';

// Helper to convert database snake_case row to Job interface
function mapRowToJob(row: any): Job {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    department: row.department,
    location: row.location,
    type: row.type,
    summary: row.summary,
    description: row.description,
    responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    mustHaveSkills: Array.isArray(row.must_have_skills) ? row.must_have_skills : [],
    salary: row.salary || undefined,
    postedAt: row.posted_at || row.created_at,
    status: row.status,
    applicantCount: row.applicant_count || 0,
  };
}

// Helper to convert database snake_case row to Candidate interface
function mapRowToCandidate(row: any): Candidate {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    jobId: row.job_id,
    jobTitle: row.job_title,
    submittedAt: row.submitted_at || row.created_at,
    status: row.status,
    decision: row.decision,
    aiScore: row.ai_score ?? 0,
    aiReasoning: row.ai_reasoning || '',
    transcript: row.transcript || '',
    recordingUrl: row.recording_url || '',
    manualOverride: row.manual_override || undefined,
  };
}

// ────────────────────────────────────────────────────────────
// JOBS API
// ────────────────────────────────────────────────────────────

export async function fetchJobs(): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('posted_at', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('Falling back to local mock jobs:', error?.message);
      return MOCK_JOBS;
    }

    return data.map(mapRowToJob);
  } catch (err) {
    console.warn('Supabase fetchJobs error, using mock data:', err);
    return MOCK_JOBS;
  }
}

export async function fetchJobById(id: string): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return MOCK_JOBS.find(j => j.id === id) || null;
    }

    return mapRowToJob(data);
  } catch (err) {
    return MOCK_JOBS.find(j => j.id === id) || null;
  }
}

export async function createJob(job: Omit<Job, 'id' | 'applicantCount' | 'postedAt'> & { id?: string }): Promise<Job> {
  const jobId = job.id || `job-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const row = {
    id: jobId,
    title: job.title,
    company: job.company,
    department: job.department,
    location: job.location,
    type: job.type,
    summary: job.summary,
    description: job.description,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    must_have_skills: job.mustHaveSkills,
    salary: job.salary || null,
    status: job.status,
    applicant_count: 0,
    posted_at: now,
  };

  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.warn('Could not insert job to Supabase, returning local object:', error.message);
      return {
        ...job,
        id: jobId,
        applicantCount: 0,
        postedAt: now,
      };
    }

    return mapRowToJob(data);
  } catch (err) {
    return {
      ...job,
      id: jobId,
      applicantCount: 0,
      postedAt: now,
    };
  }
}

// ────────────────────────────────────────────────────────────
// CANDIDATES API
// ────────────────────────────────────────────────────────────

export async function fetchCandidates(): Promise<Candidate[]> {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_CANDIDATES;
    }

    return data.map(mapRowToCandidate);
  } catch (err) {
    return MOCK_CANDIDATES;
  }
}

export async function fetchCandidateById(id: string): Promise<Candidate | null> {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return MOCK_CANDIDATES.find(c => c.id === id) || null;
    }

    return mapRowToCandidate(data);
  } catch (err) {
    return MOCK_CANDIDATES.find(c => c.id === id) || null;
  }
}

export async function updateCandidateManualOverride(
  id: string,
  override: {
    decision: Candidate['decision'];
    reason: string;
    overriddenBy: string;
    overriddenAt: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('candidates')
      .update({
        decision: override.decision,
        manual_override: override,
      })
      .eq('id', id);

    if (error) {
      console.warn('Supabase update manual override error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase update manual override exception:', err);
    return false;
  }
}

// ────────────────────────────────────────────────────────────
// APPLICATIONS / STATUS API
// ────────────────────────────────────────────────────────────

export async function submitApplication(data: {
  jobId: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  recordingUrl?: string;
  mode?: 'video' | 'audio';
  candidateId?: string; // Optional: pre-generated by the record page to match storage path
}): Promise<{ token: string; candidateId: string }> {
  const token = `tok-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  // Use the caller-supplied ID if provided (so DB row matches the storage path)
  const candidateId = data.candidateId || `cand-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  // Try creating records in Supabase
  try {
    await supabase.from('candidates').insert([
      {
        id: candidateId,
        name: data.candidateName,
        email: data.candidateEmail,
        job_id: data.jobId,
        job_title: data.jobTitle,
        status: 'received',
        decision: 'pending',
        ai_score: 0,
        ai_reasoning: '',
        transcript: '',
        recording_url: data.recordingUrl || '',
        submitted_at: now,
      },
    ]);

    await supabase.from('applications').insert([
      {
        token,
        job_id: data.jobId,
        job_title: data.jobTitle,
        candidate_id: candidateId,
        candidate_name: data.candidateName,
        candidate_email: data.candidateEmail,
        status: 'received',
        submitted_at: now,
      },
    ]);

    // Increment applicant count on job
    try {
      const { data: jobRow } = await supabase.from('jobs').select('applicant_count').eq('id', data.jobId).single();
      if (jobRow) {
        await supabase.from('jobs').update({ applicant_count: (jobRow.applicant_count || 0) + 1 }).eq('id', data.jobId);
      }
    } catch {}

    // ── Fire-and-forget AI scoring pipeline ──
    // Called AFTER DB rows are written so it never blocks the candidate's redirect.
    // The route handler updates: received → processing → decided.
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    fetch(`${baseUrl}/api/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId,
        jobId: data.jobId,
        candidateName: data.candidateName,
      }),
    }).catch(err => console.warn('AI scoring trigger failed (non-critical):', err));

  } catch (err) {
    console.warn('Error saving application to Supabase, continuing with token:', err);
  }

  return { token, candidateId };
}

export async function fetchApplicationByToken(token: string): Promise<{
  application: any;
  candidate: Candidate | null;
} | null> {
  try {
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (appError || !appData) {
      // Check mock tokens
      const mockIndex = parseInt(token.replace('tok-', ''), 10);
      const cand = MOCK_CANDIDATES[mockIndex - 1] || MOCK_CANDIDATES[0];
      return {
        application: {
          token,
          jobId: cand.jobId,
          jobTitle: cand.jobTitle,
          candidateName: cand.name,
          candidateEmail: cand.email,
          status: cand.status,
          submittedAt: cand.submittedAt,
        },
        candidate: cand,
      };
    }

    let cand: Candidate | null = null;
    if (appData.candidate_id) {
      cand = await fetchCandidateById(appData.candidate_id);
    }

    return {
      application: {
        token: appData.token,
        jobId: appData.job_id,
        jobTitle: appData.job_title,
        candidateName: appData.candidate_name,
        candidateEmail: appData.candidate_email,
        status: appData.status,
        submittedAt: appData.submitted_at,
      },
      candidate: cand,
    };
  } catch (err) {
    return null;
  }
}
