// ============================================================
// TYPES — All shared TypeScript interfaces for the platform
// ============================================================

export type JobType = 'full-time' | 'part-time' | 'contract' | 'remote' | 'hybrid';
export type DecisionType = 'selected' | 'not_selected' | 'pending' | 'manual_review';
export type ApplicationStatus = 'received' | 'processing' | 'decided' | 'expired';

export interface Job {
  id: string;
  title: string;
  company: string;
  department: string;
  location: string;
  type: JobType;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  mustHaveSkills: string[];
  salary?: string;
  postedAt: string;
  status: 'draft' | 'published';
  applicantCount: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  jobId: string;
  jobTitle: string;
  submittedAt: string;
  status: ApplicationStatus;
  decision: DecisionType;
  aiScore: number; // 0–100
  aiReasoning: string;
  transcript: string;
  recordingUrl: string;
  manualOverride?: {
    decision: DecisionType;
    reason: string;
    overriddenBy: string;
    overriddenAt: string;
  };
}

export interface ApplicationSubmission {
  jobId: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  submittedAt: string;
  token: string;
}
