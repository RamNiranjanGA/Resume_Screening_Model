// ============================================================
// PAGE 4 — CONSENT PAGE
// Route: /apply/[id]/consent
//
// Purpose: Legal consent gate shown BEFORE any recording or
// upload UI. The candidate must check "I understand and consent"
// before the Continue button becomes active. This page can
// NEVER be skipped — it's the only gateway to the recording
// page (/apply/[id]/record).
//
// What it communicates:
//   - The recording WILL be analyzed by AI
//   - What data is stored (recording, transcript, AI score)
//   - How long data is retained (90 days)
//   - Right to request deletion at any time
//   - Link to full Privacy Policy
//
// States:
//   1. unchecked — "Continue" button is disabled (greyed out)
//   2. checked   — "Continue" button becomes active (glowing)
//   3. job not found — friendly redirect back to listings
//
// This is a Client Component ('use client') because it manages
// the checkbox state interactively in the browser.
//
// Functions:
//   ConsentPage()     — main page component with checkbox logic
//   DataPointCard()   — renders one "what we store" info card
//   TimelineStep()    — renders one step in the "what happens" flow
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getJobById } from '@/lib/mock-data';
import { fetchJobById } from '@/lib/db';
import { Job } from '@/lib/types';
import {
  Shield, ShieldCheck, Lock, Eye, Clock, Trash2,
  Video, FileText, Brain, ArrowRight, ChevronLeft,
  AlertTriangle, ExternalLink, CheckCircle2,
  Database, Timer, UserX, Info, Fingerprint
} from 'lucide-react';

// ─────────────────────────────────────────────
// DATA POINT CARD — Shows one piece of stored data
// Used in the "What data we store" section.
// Each card has an icon, title, and short description.
// ─────────────────────────────────────────────
function DataPointCard({
  icon: Icon,
  color,
  title,
  description,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      alignItems: 'flex-start',
      padding: '1rem 1.25rem',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 12,
      transition: 'all 0.2s ease',
    }}>
      <div style={{
        flexShrink: 0,
        width: 40,
        height: 40,
        borderRadius: 10,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <p style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '0.2rem',
        }}>
          {title}
        </p>
        <p style={{
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          lineHeight: 1.55,
        }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TIMELINE STEP — Shows one step in the consent flow
// Used in the "What happens next" section.
// ─────────────────────────────────────────────
function TimelineStep({
  stepNumber,
  title,
  description,
  isLast = false,
}: {
  stepNumber: number;
  title: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
      {/* Vertical connector line */}
      {!isLast && (
        <div style={{
          position: 'absolute',
          left: 15,
          top: 36,
          bottom: -8,
          width: 1,
          background: 'linear-gradient(to bottom, rgba(124,58,237,0.3), rgba(124,58,237,0.05))',
        }} />
      )}

      {/* Step number bubble */}
      <div style={{
        flexShrink: 0,
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.15))',
        border: '1px solid rgba(124,58,237,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: '#A78BFA',
      }}>
        {stepNumber}
      </div>

      {/* Text */}
      <div style={{ paddingBottom: isLast ? 0 : '1.25rem' }}>
        <p style={{
          fontSize: '0.88rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '0.2rem',
        }}>
          {title}
        </p>
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          lineHeight: 1.55,
        }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN CONSENT PAGE COMPONENT
// ─────────────────────────────────────────────
export default function ConsentPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  // ── State ──
  const [consented, setConsented] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ── Fetch the job on mount (from Supabase DB with mock fallback) ──
  useEffect(() => {
    let mounted = true;
    fetchJobById(jobId)
      .then(foundJob => {
        if (!mounted) return;
        if (foundJob) {
          setJob(foundJob);
        } else {
          const local = getJobById(jobId);
          if (local) setJob(local);
          else setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        const local = getJobById(jobId);
        if (local) setJob(local);
        else setNotFound(true);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [jobId]);

  // ── Loading state ──
  if (loading) {
    return (
      <>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 1rem' }} />
            <div className="skeleton" style={{ width: 240, height: 20, margin: '0 auto 0.5rem' }} />
            <div className="skeleton" style={{ width: 180, height: 14, margin: '0 auto' }} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ── Job not found state ──
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
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
              Job Not Found
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              This role may have been filled or the link may have expired.
              Check our open positions for other opportunities.
            </p>
            <Link href="/jobs" className="btn-primary" id="consent-back-to-jobs-btn">
              Browse Open Roles
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ── Handle "Continue" click ──
  // Only proceeds if consented === true
  // Navigates to the recording page (/apply/[id]/record)
  const handleContinue = () => {
    if (!consented) return;
    router.push(`/apply/${job.id}/record`);
  };

  // ─────────────────────────────────────────────
  // MAIN RENDER — Consent form (State 1 & 2)
  // ─────────────────────────────────────────────
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>

        {/* ── TOP BANNER: Job context ── */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(124,58,237,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '1.5rem 0',
        }}>
          <div className="container-lg">
            {/* Breadcrumb */}
            <Link href={`/jobs/${job.id}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'none',
              marginBottom: '1rem',
              transition: 'color 0.2s',
            }}
              id="consent-back-to-job-link"
            >
              <ChevronLeft size={14} /> Back to {job.title}
            </Link>

            {/* Progress indicator: step 1 of 3 (Consent → Record → Submit) */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginBottom: '0.5rem',
            }}>
              <span style={{
                padding: '0.2rem 0.65rem',
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 20,
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#A78BFA',
                letterSpacing: '0.04em',
              }}>
                STEP 1 OF 3
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Consent & Privacy
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.6rem)', marginBottom: '0.25rem' }}>
              Before you record
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Applying for <strong style={{ color: 'var(--text-primary)' }}>{job.title}</strong> at {job.company}
            </p>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="container-lg" style={{ padding: '2rem 1.5rem 4rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 340px',
            gap: '2rem',
            alignItems: 'flex-start',
          }}>

            {/* ── LEFT COLUMN: Consent content ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Section 1: AI Analysis Notice */}
              <div className="glass-card-static" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1))',
                    border: '1px solid rgba(124,58,237,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Brain size={18} color="#A78BFA" />
                  </div>
                  <h2 style={{ fontSize: '1.05rem' }}>AI-Powered Analysis</h2>
                </div>

                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.75,
                  marginBottom: '1rem',
                }}>
                  Your video or voice recording will be <strong style={{ color: 'var(--text-primary)' }}>analyzed by our AI system</strong> to
                  evaluate how well your experience and skills match the requirements of this role. The AI will:
                </p>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    'Transcribe your recording into text',
                    'Evaluate your skills against the job\'s must-have requirements',
                    'Generate a match score visible only to the hiring team',
                    'Produce a decision recommendation (select / not select / manual review)',
                  ].map((item, i) => (
                    <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                      <CheckCircle2 size={15} color="#A78BFA" style={{ flexShrink: 0, marginTop: 3 }} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.55 }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <div style={{
                  marginTop: '1.25rem',
                  padding: '0.85rem 1rem',
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 10,
                  display: 'flex',
                  gap: '0.6rem',
                  alignItems: 'flex-start',
                }}>
                  <Info size={16} color="#A5B4FC" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: '0.8rem', color: '#A5B4FC', lineHeight: 1.55 }}>
                    <strong>You will never see raw AI scores.</strong> Only the hiring team reviews internal scores.
                    You'll receive a warm, human-readable decision by email.
                  </p>
                </div>
              </div>

              {/* Section 2: What Data We Store */}
              <div className="glass-card-static" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(6,182,212,0.12)',
                    border: '1px solid rgba(6,182,212,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Database size={18} color="#67E8F9" />
                  </div>
                  <h2 style={{ fontSize: '1.05rem' }}>What Data We Store</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <DataPointCard
                    icon={Video}
                    color="#A78BFA"
                    title="Your Recording"
                    description="The video or audio file you submit. Stored securely and encrypted at rest."
                  />
                  <DataPointCard
                    icon={FileText}
                    color="#67E8F9"
                    title="Transcript"
                    description="A text transcription of your recording, generated automatically by AI."
                  />
                  <DataPointCard
                    icon={Brain}
                    color="#34D399"
                    title="AI Match Score"
                    description="A numerical score (0–100) reflecting how your intro aligns with the role. Visible only to recruiters."
                  />
                  <DataPointCard
                    icon={Fingerprint}
                    color="#FCD34D"
                    title="Basic Profile Info"
                    description="Your name and email address, as provided by you when you submit."
                  />
                </div>
              </div>

              {/* Section 3: Retention & Deletion */}
              <div className="glass-card-static" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Timer size={18} color="#34D399" />
                  </div>
                  <h2 style={{ fontSize: '1.05rem' }}>Data Retention & Your Rights</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Retention period */}
                  <div style={{
                    padding: '1.15rem',
                    background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.15)',
                    borderRadius: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Clock size={15} color="#34D399" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#34D399' }}>
                        90-Day Retention
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                      All data (recording, transcript, score) is automatically deleted 90 days after submission,
                      unless you request earlier deletion.
                    </p>
                  </div>

                  {/* Deletion right */}
                  <div style={{
                    padding: '1.15rem',
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.15)',
                    borderRadius: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Trash2 size={15} color="#FCD34D" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FCD34D' }}>
                        Right to Delete
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                      You can request deletion of all your data at any time by contacting us
                      via our{' '}
                      <Link href="/support" style={{ color: '#FCD34D', textDecoration: 'underline' }}>
                        support page
                      </Link>.
                    </p>
                  </div>
                </div>

                {/* Who can access */}
                <div style={{
                  marginTop: '1rem',
                  padding: '0.85rem 1rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  display: 'flex',
                  gap: '0.6rem',
                  alignItems: 'flex-start',
                }}>
                  <Lock size={15} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    <strong>Access is restricted</strong> to recruiters at the hiring company only.
                    Your data is never shared with external parties, sold, or used for purposes
                    beyond this application.
                  </p>
                </div>
              </div>

              {/* ── CONSENT CHECKBOX ── */}
              {/* This is the core interactive element of this page. */}
              {/* The checkbox must be checked before Continue becomes active. */}
              <div className="glass-card-static" style={{
                padding: '1.5rem 1.75rem',
                background: consented
                  ? 'rgba(16,185,129,0.06)'
                  : 'rgba(124,58,237,0.04)',
                border: consented
                  ? '1px solid rgba(16,185,129,0.25)'
                  : '1px solid rgba(124,58,237,0.2)',
                transition: 'all 0.3s ease',
              }}>
                <label
                  htmlFor="consent-checkbox"
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    id="consent-checkbox"
                    className="custom-checkbox"
                    checked={consented}
                    onChange={(e) => setConsented(e.target.checked)}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <p style={{
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '0.3rem',
                    }}>
                      I understand and consent
                    </p>
                    <p style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.6,
                    }}>
                      I acknowledge that my recording will be analyzed by AI, that the data described above
                      will be stored for up to 90 days, and that I can request deletion at any time.
                      I have read and agree to the{' '}
                      <Link
                        href="/privacy"
                        style={{ color: '#A78BFA', textDecoration: 'underline' }}
                        id="consent-privacy-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Privacy Policy
                      </Link>.
                    </p>
                  </div>
                </label>
              </div>

              {/* ── ACTION BUTTONS ── */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleContinue}
                  disabled={!consented}
                  className="btn-primary"
                  id="consent-continue-btn"
                  style={{
                    padding: '0.85rem 2rem',
                    fontSize: '0.95rem',
                    opacity: consented ? 1 : 0.4,
                    cursor: consented ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {consented ? <ShieldCheck size={17} /> : <Shield size={17} />}
                  Continue to Recording
                  <ArrowRight size={16} />
                </button>

                <Link
                  href={`/jobs/${job.id}`}
                  className="btn-secondary"
                  id="consent-cancel-btn"
                  style={{ padding: '0.85rem 1.5rem' }}
                >
                  Cancel
                </Link>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Sidebar ── */}
            <div style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* What Happens Next card */}
              <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                <h3 style={{
                  fontWeight: 700, marginBottom: '1.15rem',
                  color: 'var(--text-secondary)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', fontSize: '0.72rem',
                }}>
                  How the process works
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <TimelineStep
                    stepNumber={1}
                    title="Review & consent (you are here)"
                    description="Read what data we collect and how it's used, then check the consent box."
                  />
                  <TimelineStep
                    stepNumber={2}
                    title="Record or upload"
                    description="Record a 60–90 second video or voice intro, or upload a pre-recorded file."
                  />
                  <TimelineStep
                    stepNumber={3}
                    title="Get your response"
                    description="Our AI reviews your submission. You'll receive a decision by email — typically within 10 minutes."
                    isLast
                  />
                </div>
              </div>

              {/* Trust & Security card */}
              <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                <h3 style={{
                  fontWeight: 700, marginBottom: '1.15rem',
                  color: 'var(--text-secondary)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', fontSize: '0.72rem',
                }}>
                  Trust & Security
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {[
                    { icon: Lock, color: '#A78BFA', text: 'End-to-end encryption on all recordings' },
                    { icon: Eye, color: '#67E8F9', text: 'Only authorized recruiters see your data' },
                    { icon: UserX, color: '#34D399', text: 'No data shared with third parties' },
                    { icon: Trash2, color: '#FCD34D', text: 'Auto-deleted after 90 days' },
                  ].map(({ icon: Icon, color, text }) => (
                    <div key={text} style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
                      <Icon size={14} color={color} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Policy Link card */}
              <Link
                href="/privacy"
                className="glass-card"
                id="consent-privacy-card-link"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Shield size={16} color="#A78BFA" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Read Full Privacy Policy</span>
                </div>
                <ExternalLink size={14} color="var(--text-muted)" />
              </Link>

              {/* Job summary mini-card */}
              <div className="glass-card-static" style={{ padding: '1.25rem' }}>
                <p style={{
                  fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem',
                }}>
                  Applying For
                </p>
                <p style={{
                  fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)',
                  marginBottom: '0.25rem',
                }}>
                  {job.title}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {job.company} · {job.location}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE STICKY CONTINUE BAR ── */}
        <div style={{
          display: 'none',
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: 'rgba(8,11,20,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '1rem 1.5rem',
          zIndex: 200,
        }} id="mobile-consent-bar">
          <button
            onClick={handleContinue}
            disabled={!consented}
            className="btn-primary"
            style={{
              width: '100%', justifyContent: 'center', padding: '0.85rem',
              opacity: consented ? 1 : 0.4,
              cursor: consented ? 'pointer' : 'not-allowed',
            }}
          >
            {consented ? <ShieldCheck size={17} /> : <Shield size={17} />}
            Continue to Recording
            <ArrowRight size={16} />
          </button>
        </div>

        <style>{`
          @media (max-width: 768px) {
            #mobile-consent-bar { display: block !important; }
            /* Stack to single column on mobile */
            .container-lg > div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 500px) {
            /* On very small screens, stack the retention cards */
            .container-lg > div[style*="gridTemplateColumns"] div[style*="grid-template-columns: 1fr 1fr"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

      </main>
      <Footer />
    </>
  );
}
