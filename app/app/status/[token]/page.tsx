// ============================================================
// PAGE 7 — PROCESSING / STATUS PAGE
// Route: /status/[token]
//
// Purpose: A page the candidate can revisit (via email link or
// "check status" button on the confirmation page) to see their
// application's current state.
//
// Shows a simple 3-step progress indicator:
//   Received → Processing → Decision Made
//
// IMPORTANT: Never expose raw AI scores, confidence numbers,
// or internal reasoning on this page. Only recruiters see
// those (Page 12). Candidates see a human-friendly status.
//
// States handled:
//   1. received    — submission is in the queue
//   2. processing  — AI is analysing the recording
//   3. decided     — decision made, link to view result
//   4. expired     — invalid or old token / not found
//
// In production: the token would be a unique URL-safe ID
// generated at submission time, sent to the candidate by email.
// Here we simulate with mock data lookups.
//
// Functions:
//   StatusPage()         — main page component, routes to state
//   ProgressTracker()    — the 3-step visual progress indicator
//   StatusCard()         — renders the content for each state
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { MOCK_CANDIDATES } from '@/lib/mock-data';
import { ApplicationStatus } from '@/lib/types';
import {
  CheckCircle2, Clock, Brain, Mail, ArrowRight,
  AlertTriangle, ExternalLink, Inbox, Loader,
  Shield, Briefcase, Calendar, RefreshCw,
  HelpCircle, ChevronRight, XCircle, Sparkles
} from 'lucide-react';

// ── Map tokens to mock candidates for demo purposes ──
// In production: token → database lookup
// For demo: we map simple tokens to our mock candidates
const TOKEN_MAP: Record<string, string> = {
  'demo-token':       'cand-001',  // Priya — decided/selected
  'demo-processing':  'cand-004',  // Aditya — processing
  'demo-received':    'cand-005',  // Sneha — received
  'demo-rejected':    'cand-002',  // Arjun — decided/not_selected
  'demo-review':      'cand-003',  // Kavitha — decided/manual_review
};

// ── Status step definitions ──
const STEPS = [
  { key: 'received',   label: 'Received',       icon: Inbox,  description: 'Your submission has been received' },
  { key: 'processing', label: 'Processing',     icon: Brain,  description: 'AI is analysing your intro' },
  { key: 'decided',    label: 'Decision Made',  icon: Mail,   description: 'A decision has been reached' },
] as const;

// Maps ApplicationStatus to which step index is active
function getActiveStep(status: ApplicationStatus): number {
  switch (status) {
    case 'received':   return 0;
    case 'processing': return 1;
    case 'decided':    return 2;
    default:           return -1; // expired
  }
}

// ─────────────────────────────────────────────
// PROGRESS TRACKER — Visual 3-step indicator
// Shows Received → Processing → Decision Made
// with connecting lines and active/done states.
// ─────────────────────────────────────────────
function ProgressTracker({ activeStep }: { activeStep: number }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      position: 'relative',
      padding: '0 1rem',
      marginBottom: '2.5rem',
    }}>
      {/* Connecting line (background) */}
      <div style={{
        position: 'absolute',
        top: 24,
        left: 'calc(16.67% + 1rem)',
        right: 'calc(16.67% + 1rem)',
        height: 2,
        background: 'rgba(255,255,255,0.06)',
        zIndex: 0,
      }} />

      {/* Connecting line (progress fill) */}
      <div style={{
        position: 'absolute',
        top: 24,
        left: 'calc(16.67% + 1rem)',
        width: activeStep === 0
          ? '0%'
          : activeStep === 1
            ? '50%'
            : '100%',
        maxWidth: 'calc(66.67% - 2rem)',
        height: 2,
        background: 'linear-gradient(90deg, var(--accent-green), var(--accent-purple))',
        zIndex: 1,
        transition: 'width 0.8s ease',
      }} />

      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isDone = i < activeStep;
        const isActive = i === activeStep;
        const isFuture = i > activeStep;

        return (
          <div
            key={step.key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              flex: 1,
              zIndex: 2,
            }}
          >
            {/* Circle */}
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.4s ease',
              background: isDone
                ? 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.15))'
                : isActive
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.15))'
                  : 'rgba(255,255,255,0.04)',
              border: isDone
                ? '2px solid rgba(16,185,129,0.5)'
                : isActive
                  ? '2px solid rgba(124,58,237,0.5)'
                  : '2px solid rgba(255,255,255,0.08)',
              boxShadow: isActive
                ? '0 0 20px rgba(124,58,237,0.3)'
                : isDone
                  ? '0 0 15px rgba(16,185,129,0.2)'
                  : 'none',
            }}>
              {isDone ? (
                <CheckCircle2 size={22} color="#34D399" />
              ) : isActive ? (
                <Icon size={22} color="#A78BFA" />
              ) : (
                <Icon size={22} color="var(--text-muted)" />
              )}
            </div>

            {/* Label */}
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isDone
                  ? '#34D399'
                  : isActive
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                marginBottom: '0.15rem',
              }}>
                {step.label}
              </p>
              <p style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                maxWidth: 140,
              }}>
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN STATUS PAGE COMPONENT
// ─────────────────────────────────────────────
export default function StatusPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  // Look up candidate by token
  const candidateId = TOKEN_MAP[token];
  const candidate = candidateId
    ? MOCK_CANDIDATES.find(c => c.id === candidateId)
    : null;

  useEffect(() => {
    // Simulate async lookup
    const timer = setTimeout(() => {
      if (!candidate) setExpired(true);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [candidate]);

  // ── Loading ──
  if (loading) {
    return (
      <>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 1rem' }} />
            <div className="skeleton" style={{ width: 240, height: 18, margin: '0 auto 0.5rem' }} />
            <div className="skeleton" style={{ width: 160, height: 14, margin: '0 auto' }} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ── State 4: Expired / Not Found ──
  if (expired || !candidate) {
    return (
      <>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 460 }}>
            <div style={{
              width: 80, height: 80,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <XCircle size={32} color="#FCD34D" />
            </div>

            <span style={{
              display: 'inline-block',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              color: '#FCD34D',
              fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '0.3rem 0.8rem', borderRadius: 20, marginBottom: '1.25rem',
            }}>
              Link Expired or Invalid
            </span>

            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
              We couldn't find this application
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem', fontSize: '0.9rem' }}>
              This link may have expired, or the application token is invalid.
              If you recently applied, check your email for the correct status link.
              If this keeps happening, contact our support team.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/jobs" className="btn-primary" id="expired-browse-btn">
                <Briefcase size={16} /> Browse Open Roles
              </Link>
              <Link href="/support" className="btn-secondary">
                <HelpCircle size={16} /> Contact Support
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ── Determine active step ──
  const activeStep = getActiveStep(candidate.status);
  const isDecided = candidate.status === 'decided';
  const isProcessing = candidate.status === 'processing';
  const isReceived = candidate.status === 'received';

  // Format submission time
  const submittedDate = new Date(candidate.submittedAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  // ─────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>

        {/* ── HERO SECTION ── */}
        <div style={{
          background: isDecided
            ? 'linear-gradient(180deg, rgba(16,185,129,0.06) 0%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(124,58,237,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '3rem 0 2rem',
          textAlign: 'center',
        }}>
          <div className="container-lg">
            {/* Status icon */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: isDecided
                ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))'
                : isProcessing
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))'
                  : 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.08))',
              border: isDecided
                ? '2px solid rgba(16,185,129,0.35)'
                : isProcessing
                  ? '2px solid rgba(124,58,237,0.35)'
                  : '2px solid rgba(6,182,212,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: isDecided
                ? '0 0 30px rgba(16,185,129,0.15)'
                : '0 0 30px rgba(124,58,237,0.12)',
            }}>
              {isDecided ? (
                <CheckCircle2 size={32} color="#34D399" />
              ) : isProcessing ? (
                <Brain size={32} color="#A78BFA" />
              ) : (
                <Inbox size={32} color="#67E8F9" />
              )}
            </div>

            {/* Badge */}
            <span style={{
              display: 'inline-block',
              background: isDecided
                ? 'rgba(16,185,129,0.12)' : isProcessing
                  ? 'rgba(124,58,237,0.12)' : 'rgba(6,182,212,0.12)',
              border: `1px solid ${isDecided
                ? 'rgba(16,185,129,0.25)' : isProcessing
                  ? 'rgba(124,58,237,0.25)' : 'rgba(6,182,212,0.25)'}`,
              color: isDecided ? '#34D399' : isProcessing ? '#A78BFA' : '#67E8F9',
              fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '0.3rem 0.85rem', borderRadius: 20, marginBottom: '1rem',
            }}>
              {isDecided ? '✦ Decision Made' : isProcessing ? '⟳ Processing' : '✦ Received'}
            </span>

            <h1 style={{ fontSize: 'clamp(1.3rem, 3.5vw, 1.8rem)', marginBottom: '0.5rem' }}>
              {isDecided
                ? 'Your application has been reviewed'
                : isProcessing
                  ? "We're reviewing your submission"
                  : "We've received your application"}
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: 480, margin: '0 auto' }}>
              Application for <strong style={{ color: 'var(--text-primary)' }}>{candidate.jobTitle}</strong>
            </p>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="container-lg" style={{ padding: '2.5rem 1.5rem 4rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 300px',
            gap: '2rem',
            alignItems: 'flex-start',
          }}>

            {/* ── LEFT COLUMN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Progress Tracker */}
              <div className="glass-card-static" style={{ padding: '2rem 1.5rem 1.5rem' }}>
                <h2 style={{
                  fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: '2rem', textAlign: 'center',
                }}>
                  Application Progress
                </h2>
                <ProgressTracker activeStep={activeStep} />
              </div>

              {/* ── State-specific content ── */}

              {/* STATE 1: Received */}
              {isReceived && (
                <div className="glass-card-static" style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(6,182,212,0.12)',
                      border: '1px solid rgba(6,182,212,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Inbox size={17} color="#67E8F9" />
                    </div>
                    <h2 style={{ fontSize: '1.05rem' }}>Submission Received</h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                    Your video intro is in our queue. Our AI will begin processing it shortly — most
                    submissions are picked up within a few minutes. You'll receive an email once a
                    decision has been made.
                  </p>
                  <div className="alert-info" style={{ marginTop: '0.5rem' }}>
                    <Clock size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: '0.82rem', lineHeight: 1.55 }}>
                      <strong>Estimated wait:</strong> Most applications are processed within 10 minutes.
                      You don't need to stay on this page.
                    </p>
                  </div>
                </div>
              )}

              {/* STATE 2: Processing */}
              {isProcessing && (
                <div className="glass-card-static" style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(124,58,237,0.12)',
                      border: '1px solid rgba(124,58,237,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Brain size={17} color="#A78BFA" />
                    </div>
                    <h2 style={{ fontSize: '1.05rem' }}>Analysis in Progress</h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                    Our AI is currently reviewing your submission. Here's what's happening behind the scenes:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {[
                      { label: 'Transcribing your recording', done: true },
                      { label: 'Evaluating skills and experience', done: false },
                      { label: 'Matching against job requirements', done: false },
                      { label: 'Generating decision', done: false },
                    ].map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.6rem 0.85rem',
                        background: item.done ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${item.done ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)'}`,
                        borderRadius: 10,
                      }}>
                        {item.done ? (
                          <CheckCircle2 size={15} color="#34D399" />
                        ) : i === 1 ? (
                          <Loader size={15} color="#A78BFA" style={{ animation: 'spin-slow 2s linear infinite' }} />
                        ) : (
                          <Clock size={15} color="var(--text-muted)" />
                        )}
                        <span style={{
                          fontSize: '0.85rem',
                          color: item.done ? '#34D399' : i === 1 ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontWeight: item.done || i === 1 ? 500 : 400,
                        }}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    You'll receive an email notification as soon as processing is complete.
                    No need to refresh this page — it will update automatically.
                  </p>
                </div>
              )}

              {/* STATE 3: Decided */}
              {isDecided && (
                <div className="glass-card-static" style={{
                  padding: '1.75rem',
                  background: 'linear-gradient(145deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))',
                  border: '1px solid rgba(16,185,129,0.18)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CheckCircle2 size={17} color="#34D399" />
                    </div>
                    <h2 style={{ fontSize: '1.05rem' }}>Decision Complete</h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                    Your application has been reviewed and a decision has been made. We've sent the
                    details to your email address. You can also view the decision below.
                  </p>

                  <Link
                    href={`/result/${token}`}
                    className="btn-primary"
                    id="status-view-decision-btn"
                    style={{ padding: '0.85rem 2rem', fontSize: '0.95rem' }}
                  >
                    <Sparkles size={16} /> View Your Decision <ArrowRight size={16} />
                  </Link>

                  <div className="alert-success" style={{ marginTop: '1.25rem' }}>
                    <Mail size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: '0.82rem', lineHeight: 1.55 }}>
                      A detailed email has also been sent to <strong>{candidate.email}</strong>.
                      Check your inbox (and spam folder, just in case).
                    </p>
                  </div>
                </div>
              )}

              {/* Application details (always shown) */}
              <div className="glass-card-static" style={{ padding: '0.5rem 0' }}>
                <div style={{ padding: '0.85rem 1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 4, height: 18, background: 'linear-gradient(#7C3AED, #06B6D4)', borderRadius: 2, display: 'inline-block' }} />
                    Application Details
                  </h3>
                </div>
                {[
                  { icon: Briefcase, color: '#A78BFA', label: 'Position', value: candidate.jobTitle },
                  { icon: Calendar, color: '#67E8F9', label: 'Submitted', value: submittedDate },
                  { icon: Mail, color: '#34D399', label: 'Notification Email', value: candidate.email },
                ].map(({ icon: Icon, color, label, value }) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.75rem 1.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{
                      flexShrink: 0, width: 32, height: 32, borderRadius: 8,
                      background: `${color}15`, border: `1px solid ${color}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={14} color={color} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {label}
                      </p>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT COLUMN: Sidebar ── */}
            <div style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Help card */}
              <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                <h3 style={{
                  fontWeight: 700, marginBottom: '1rem',
                  color: 'var(--text-secondary)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', fontSize: '0.72rem',
                }}>
                  Frequently Asked
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {[
                    { q: 'How long does processing take?', a: 'Most submissions are reviewed within 10 minutes.' },
                    { q: 'How will I be notified?', a: "You'll receive an email at the address you provided." },
                    { q: 'Can I resubmit?', a: 'Once submitted, you cannot resubmit for the same role.' },
                    { q: 'Who reviews my submission?', a: 'AI analyses it first, then the hiring team may review.' },
                  ].map(({ q, a }) => (
                    <div key={q} style={{
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: 10,
                    }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                        {q}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Need help */}
              <Link
                href="/support"
                className="glass-card"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none', color: 'var(--text-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <HelpCircle size={16} color="#A78BFA" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Need Help?</span>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </Link>

              {/* Browse more jobs */}
              <Link
                href="/jobs"
                className="glass-card"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none', color: 'var(--text-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Briefcase size={16} color="#67E8F9" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Browse More Roles</span>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </Link>

              {/* Data protection */}
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
            </div>
          </div>
        </div>

        {/* Responsive */}
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
