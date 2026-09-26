// ============================================================
// PAGE 6 — SUBMISSION CONFIRMATION PAGE
// Route: /apply/[id]/confirm
//
// Purpose: Shown immediately after a successful recording
// submission. Confirms what was submitted and sets expectations
// for what happens next.
//
// What it displays:
//   - Job title the candidate applied to
//   - Candidate name (simulated; in prod, from session/form data)
//   - Submission timestamp
//   - Processing time estimate
//   - How they'll be notified (email)
//   - Link back to job listings
//   - Link to check status (future Page 7)
//
// States: default only — always shows the same content on
// success. There is no error state here; errors are handled
// on the recording page (Page 5) before reaching this page.
//
// Functions:
//   ConfirmationPage()     — main page component
//   ConfirmationDetail()   — renders one key-value detail row
//   NextStepCard()         — renders one "what happens next" item
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getJobById } from '@/lib/mock-data';
import { fetchJobById } from '@/lib/db';
import { Job } from '@/lib/types';
import {
  CheckCircle2, ArrowRight, Briefcase, Mail, Clock,
  User, Calendar, FileVideo, Brain, Bell,
  ExternalLink, AlertTriangle, Sparkles, Shield,
  Search, ChevronRight
} from 'lucide-react';

// ─────────────────────────────────────────────
// CONFIRMATION DETAIL — One key-value row
// Used to display submission details like job
// title, candidate name, timestamp, etc.
// ─────────────────────────────────────────────
function ConfirmationDetail({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '0.85rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{
        flexShrink: 0, width: 34, height: 34, borderRadius: 9,
        background: `${color}15`,
        border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>
          {label}
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// NEXT STEP CARD — One step in the
// "what happens next" section
// ─────────────────────────────────────────────
function NextStepCard({
  stepNumber,
  icon: Icon,
  color,
  title,
  description,
}: {
  stepNumber: number;
  icon: React.ElementType;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <div style={{
      display: 'flex', gap: '1rem', alignItems: 'flex-start',
      padding: '1.15rem 1.25rem',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 12,
      transition: 'all 0.2s ease',
    }}>
      <div style={{
        flexShrink: 0, width: 40, height: 40, borderRadius: 12,
        background: `${color}12`,
        border: `1px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <Icon size={18} color={color} />
        {/* Step number badge */}
        <span style={{
          position: 'absolute', top: -6, right: -6,
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--bg-primary)',
          border: `1.5px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem', fontWeight: 800, color,
        }}>
          {stepNumber}
        </span>
      </div>
      <div>
        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {title}
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN CONFIRMATION PAGE
// ─────────────────────────────────────────────
export default function ConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const jobId = params.id as string;
  const token = searchParams.get('token');

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submissionTime] = useState(() => new Date());

  // ── Fetch job on mount ──
  useEffect(() => {
    fetchJobById(jobId).then(foundJob => {
      if (foundJob) {
        setJob(foundJob);
      } else {
        const local = getJobById(jobId);
        if (local) setJob(local);
        else setNotFound(true);
      }
      setLoading(false);
    });
  }, [jobId]);

  // ── Format the submission timestamp ──
  // e.g. "20 Sep 2026, 7:32 PM IST"
  const formattedTime = submissionTime.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });

  // ── Loading ──
  if (loading) {
    return (
      <>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1rem' }} />
            <div className="skeleton" style={{ width: 260, height: 20, margin: '0 auto 0.5rem' }} />
            <div className="skeleton" style={{ width: 200, height: 14, margin: '0 auto' }} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ── Job not found ──
  if (notFound || !job) {
    return (
      <>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 440 }}>
            <div style={{
              width: 72, height: 72,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <AlertTriangle size={28} color="#FCD34D" />
            </div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Job Not Found</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              This role may have been filled or the link may have expired.
            </p>
            <Link href="/jobs" className="btn-primary">Browse Open Roles</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ─────────────────────────────────────────
  // MAIN RENDER — Confirmation (default state)
  // ─────────────────────────────────────────
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>

        {/* ── SUCCESS HERO SECTION ── */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 40%, transparent 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '3.5rem 0 2.5rem',
          textAlign: 'center',
        }}>
          <div className="container-lg">
            {/* Animated checkmark */}
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))',
              border: '2px solid rgba(16,185,129,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 0 40px rgba(16,185,129,0.15)',
              animation: 'fadeInUp 0.6s ease forwards',
            }}>
              <CheckCircle2 size={40} color="#34D399" />
            </div>

            {/* Success badge */}
            <span style={{
              display: 'inline-block',
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.25)',
              color: '#34D399',
              fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '0.3rem 0.85rem', borderRadius: 20,
              marginBottom: '1rem',
              animation: 'fadeInUp 0.6s ease 0.1s forwards',
              opacity: 0,
            }}>
              ✦ Application Submitted
            </span>

            <h1 style={{
              fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
              marginBottom: '0.5rem',
              animation: 'fadeInUp 0.6s ease 0.2s forwards',
              opacity: 0,
            }}>
              You're all set!
            </h1>

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem', lineHeight: 1.6,
              maxWidth: 480, margin: '0 auto',
              animation: 'fadeInUp 0.6s ease 0.3s forwards',
              opacity: 0,
            }}>
              Your video intro for <strong style={{ color: 'var(--text-primary)' }}>{job.title}</strong> has
              been received. Here's what happens next.
            </p>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="container-lg" style={{ padding: '2.5rem 1.5rem 4rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 320px',
            gap: '2rem',
            alignItems: 'flex-start',
          }}>

            {/* ── LEFT COLUMN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Submission details card */}
              <div className="glass-card-static" style={{ padding: '0.5rem 0', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem 0.75rem' }}>
                  <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 4, height: 20, background: 'linear-gradient(#10B981, #06B6D4)', borderRadius: 2, display: 'inline-block' }} />
                    Submission Details
                  </h2>
                </div>

                <ConfirmationDetail
                  icon={Briefcase}
                  color="#A78BFA"
                  label="Position"
                  value={job.title}
                />
                <ConfirmationDetail
                  icon={User}
                  color="#67E8F9"
                  label="Candidate"
                  value="You"
                />
                <ConfirmationDetail
                  icon={Calendar}
                  color="#34D399"
                  label="Submitted"
                  value={formattedTime}
                />
                <ConfirmationDetail
                  icon={FileVideo}
                  color="#FCD34D"
                  label="Format"
                  value="Video / Voice Intro"
                />
                <ConfirmationDetail
                  icon={Sparkles}
                  color="#A78BFA"
                  label="Company"
                  value={`${job.company} · ${job.department}`}
                />
              </div>

              {/* What happens next card */}
              <div className="glass-card-static" style={{ padding: '1.75rem' }}>
                <h2 style={{
                  fontSize: '1rem', marginBottom: '1.25rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <span style={{ width: 4, height: 20, background: 'linear-gradient(#7C3AED, #4F46E5)', borderRadius: 2, display: 'inline-block' }} />
                  What Happens Next
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <NextStepCard
                    stepNumber={1}
                    icon={Brain}
                    color="#A78BFA"
                    title="AI processes your intro"
                    description="Our AI transcribes your recording and evaluates how your experience matches the role's requirements. This usually takes a few minutes."
                  />
                  <NextStepCard
                    stepNumber={2}
                    icon={Search}
                    color="#67E8F9"
                    title="The hiring team reviews"
                    description="Recruiters may review your submission alongside the AI's analysis. Some candidates may be flagged for additional human review."
                  />
                  <NextStepCard
                    stepNumber={3}
                    icon={Mail}
                    color="#34D399"
                    title="You'll hear back by email"
                    description="You'll receive a decision at the email address you provided — typically within 10 minutes for AI-only decisions, or within 24 hours if human review is needed."
                  />
                </div>
              </div>

              {/* Processing time notice */}
              <div style={{
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                padding: '1rem 1.25rem',
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 12,
              }}>
                <Clock size={17} color="#A5B4FC" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#A5B4FC', fontWeight: 600, marginBottom: '0.2rem' }}>
                    Processing may take a few minutes
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    Our AI is now analyzing your submission. You don't need to stay on this page —
                    we'll send everything to your email once a decision is made.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {token && (
                  <Link
                    href={`/status/${token}`}
                    className="btn-primary"
                    id="confirm-track-status-btn"
                    style={{ padding: '0.85rem 2rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Clock size={16} /> Track Application Status
                  </Link>
                )}
                <Link
                  href="/jobs"
                  className={token ? "btn-secondary" : "btn-primary"}
                  id="confirm-back-to-listings-btn"
                  style={{ padding: '0.85rem 2rem', fontSize: '0.95rem' }}
                >
                  <Briefcase size={16} /> Back to Job Listings
                </Link>
                <Link
                  href="/"
                  className="btn-secondary"
                  id="confirm-home-btn"
                  style={{ padding: '0.85rem 1.5rem' }}
                >
                  Go to Homepage
                </Link>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Sidebar ── */}
            <div style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Notification method card */}
              <div className="glass-card-static" style={{
                padding: '1.5rem',
                background: 'linear-gradient(145deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))',
                border: '1px solid rgba(16,185,129,0.15)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  marginBottom: '1rem',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Bell size={17} color="#34D399" />
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>How We'll Notify You</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1rem' }}>
                  You'll receive an email with your application decision. The email will include:
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    'Clear decision (selected or not selected)',
                    'Specific next steps if selected',
                    'Warm, personalized feedback',
                  ].map((item, i) => (
                    <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <CheckCircle2 size={14} color="#34D399" style={{ flexShrink: 0, marginTop: 3 }} />
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status check card */}
              <Link
                href={`/status/demo-token`}
                className="glass-card"
                id="confirm-check-status-link"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Search size={16} color="#A78BFA" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Check Application Status</span>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </Link>

              {/* Data protection badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.85rem 1.15rem',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.15)',
                borderRadius: 12,
              }}>
                <Shield size={15} color="#34D399" />
                <span style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 500 }}>
                  Your data is encrypted and protected
                </span>
              </div>

              {/* Job applied to card */}
              <div className="glass-card-static" style={{ padding: '1.25rem' }}>
                <p style={{
                  fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem',
                }}>
                  Applied To
                </p>
                <p style={{
                  fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)',
                  marginBottom: '0.25rem',
                }}>
                  {job.title}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {job.company} · {job.location}
                </p>
                <Link
                  href={`/jobs/${job.id}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    fontSize: '0.78rem', color: '#A78BFA', textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  View job details <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Responsive ── */}
        <style>{`
          @media (max-width: 768px) {
            .container-lg > div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

      </main>
      <Footer />
    </>
  );
}
