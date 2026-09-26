// ============================================================
// PAGE 8 — RESULT PAGE (Candidate-Facing)
// Route: /result/[token]
//
// Purpose: Shows the candidate their application decision.
// This is the same content that would be sent by email.
// The candidate reaches this page either via:
//   - A direct link in their email notification
//   - The "View Your Decision" button on the status page (Page 7)
//
// CRITICAL RULE: Never expose raw AI scores, confidence
// numbers, or internal reasoning. Only warm, human-readable
// messages. Recruiters see the internals on Page 12.
//
// States:
//   1. selected      — congratulations, next steps to schedule
//   2. not_selected  — warm thanks, invite to future roles
//   3. manual_review — borderline, under human review
//   4. pending       — decision not yet ready
//   5. expired       — invalid token / not found
//
// Functions:
//   ResultPage()         — main component, routes to decision
//   SelectedResult()     — congratulatory view with next steps
//   NotSelectedResult()  — warm rejection with encouragement
//   ManualReviewResult() — borderline, pending human review
//   PendingResult()      — decision not ready yet
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { MOCK_CANDIDATES } from '@/lib/mock-data';
import { fetchApplicationByToken } from '@/lib/db';
import { Candidate } from '@/lib/types';
import {
  CheckCircle2, XCircle, Clock, ArrowRight,
  AlertTriangle, ExternalLink, Briefcase, Calendar,
  Mail, Star, Heart, Sparkles, Award, Users,
  ChevronRight, HelpCircle, Shield, PartyPopper,
  CalendarCheck, MessageCircle, RefreshCw
} from 'lucide-react';

// Token-to-candidate mapping (same as status page)
const TOKEN_MAP: Record<string, string> = {
  'demo-token':       'cand-001',  // Priya — selected
  'demo-rejected':    'cand-002',  // Arjun — not_selected
  'demo-review':      'cand-003',  // Kavitha — manual_review
  'demo-processing':  'cand-004',  // Aditya — pending (still processing)
  'demo-received':    'cand-005',  // Sneha — pending (just received)
};

// ─────────────────────────────────────────────
// SELECTED RESULT — Candidate was chosen
// Warm congratulations + clear next step
// (schedule an interview)
// ─────────────────────────────────────────────
function SelectedResult({ candidate }: { candidate: Candidate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Hero message */}
      <div className="glass-card-static" style={{
        padding: '2.5rem 2rem',
        background: 'linear-gradient(145deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
        border: '1px solid rgba(16,185,129,0.2)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.1))',
          border: '2px solid rgba(16,185,129,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 0 40px rgba(16,185,129,0.2)',
        }}>
          <Award size={36} color="#34D399" />
        </div>

        <span style={{
          display: 'inline-block',
          background: 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.3)',
          color: '#34D399',
          fontSize: '0.72rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '0.3rem 0.85rem', borderRadius: 20, marginBottom: '1rem',
        }}>
          Congratulations!
        </span>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', lineHeight: 1.3 }}>
          {"You've been selected for the next round"}
        </h2>

        <p style={{
          color: 'var(--text-secondary)', fontSize: '0.95rem',
          lineHeight: 1.7, maxWidth: 500, margin: '0 auto',
        }}>
          We were impressed by your intro for the{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{candidate.jobTitle}</strong>{' '}
          position. Your experience and communication stood out, and we would love to
          take this forward.
        </p>
      </div>

      {/* Next steps */}
      <div className="glass-card-static" style={{ padding: '1.75rem' }}>
        <h3 style={{
          fontSize: '1rem', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{ width: 4, height: 20, background: 'linear-gradient(#10B981, #06B6D4)', borderRadius: 2, display: 'inline-block' }} />
          Your Next Steps
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {[
            {
              icon: CalendarCheck, color: '#34D399',
              title: 'Schedule your interview',
              desc: "Click the button below to pick a time that works for you. We'll pair you with a team member for a 30-minute conversation.",
            },
            {
              icon: MessageCircle, color: '#67E8F9',
              title: 'Prepare for the conversation',
              desc: "This will be a friendly, two-way chat. Come ready to share more about your experience and ask any questions about the role or team.",
            },
            {
              icon: Mail, color: '#A78BFA',
              title: 'Check your email',
              desc: "We've also sent these details to your inbox. If you don't see it, check your spam folder.",
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} style={{
              display: 'flex', gap: '1rem', alignItems: 'flex-start',
              padding: '1rem 1.15rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 12,
            }}>
              <div style={{
                flexShrink: 0, width: 38, height: 38, borderRadius: 10,
                background: `${color}12`, border: `1px solid ${color}28`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={17} color={color} />
              </div>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {title}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <div style={{ marginTop: '1.5rem' }}>
          <button
            className="btn-primary"
            id="schedule-interview-btn"
            style={{
              padding: '0.9rem 2.5rem', fontSize: '1rem',
              width: '100%', justifyContent: 'center',
            }}
          >
            <CalendarCheck size={18} /> Schedule Your Interview <ArrowRight size={16} />
          </button>
          <p style={{
            textAlign: 'center', marginTop: '0.75rem',
            fontSize: '0.78rem', color: 'var(--text-muted)',
          }}>
            Please schedule within 5 business days
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// NOT SELECTED RESULT — Candidate was not chosen
// Warm, respectful message. No generic boilerplate.
// Optionally invite to apply to future roles.
// ─────────────────────────────────────────────
function NotSelectedResult({ candidate }: { candidate: Candidate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Hero message */}
      <div className="glass-card-static" style={{
        padding: '2.5rem 2rem',
        textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <Heart size={30} color="#A5B4FC" />
        </div>

        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', lineHeight: 1.3 }}>
          Thank you for your time, {candidate.name.split(' ')[0]}
        </h2>

        <p style={{
          color: 'var(--text-secondary)', fontSize: '0.95rem',
          lineHeight: 1.75, maxWidth: 520, margin: '0 auto',
        }}>
          We really appreciate you taking the time to record an intro for the{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{candidate.jobTitle}</strong>{' '}
          position. After careful review, {"we've decided to move forward with other candidates "}
          {"whose experience more closely aligns with what we're looking for in this specific role."}
        </p>
      </div>

      {/* Encouragement */}
      <div className="glass-card-static" style={{ padding: '1.75rem' }}>
        <h3 style={{
          fontSize: '1rem', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{ width: 4, height: 20, background: 'linear-gradient(#6366F1, #06B6D4)', borderRadius: 2, display: 'inline-block' }} />
          This is not the end
        </h3>

        <p style={{
          color: 'var(--text-secondary)', fontSize: '0.9rem',
          lineHeight: 1.7, marginBottom: '1.25rem',
        }}>
          {"Every role has different needs, and not being selected for this one doesn't reflect "}
          {"your overall abilities. We post new roles regularly, and we'd genuinely love to see "}
          you apply again when a role matches your strengths.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {[
            { icon: Star, color: '#FCD34D', text: 'Your submission showed real effort and thought' },
            { icon: RefreshCw, color: '#67E8F9', text: "New roles are posted every week — you're welcome to reapply anytime" },
            { icon: Users, color: '#A78BFA', text: 'Different teams look for different qualities' },
          ].map(({ icon: Icon, color, text }) => (
            <div key={text} style={{
              display: 'flex', gap: '0.7rem', alignItems: 'center',
              padding: '0.7rem 0.9rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 10,
            }}>
              <Icon size={15} color={color} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          <Link
            href="/jobs"
            className="btn-primary"
            id="browse-more-roles-btn"
            style={{ padding: '0.85rem 2rem' }}
          >
            <Briefcase size={16} /> Browse Open Roles
          </Link>
          <Link
            href="/support"
            className="btn-secondary"
            style={{ padding: '0.85rem 1.5rem' }}
          >
            <HelpCircle size={15} /> Have Questions?
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MANUAL REVIEW RESULT — Borderline score,
// routed to human review instead of automatic
// decision. Candidate is told their application
// is being reviewed by the hiring team.
// ─────────────────────────────────────────────
function ManualReviewResult({ candidate }: { candidate: Candidate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Hero message */}
      <div className="glass-card-static" style={{
        padding: '2.5rem 2rem',
        background: 'linear-gradient(145deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))',
        border: '1px solid rgba(245,158,11,0.18)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 76, height: 76, borderRadius: '50%',
          background: 'rgba(245,158,11,0.12)',
          border: '1.5px solid rgba(245,158,11,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <Users size={32} color="#FCD34D" />
        </div>

        <span style={{
          display: 'inline-block',
          background: 'rgba(245,158,11,0.12)',
          border: '1px solid rgba(245,158,11,0.25)',
          color: '#FCD34D',
          fontSize: '0.72rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '0.3rem 0.85rem', borderRadius: 20, marginBottom: '1rem',
        }}>
          Under Human Review
        </span>

        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', lineHeight: 1.3 }}>
          Your application is being reviewed by our team
        </h2>

        <p style={{
          color: 'var(--text-secondary)', fontSize: '0.95rem',
          lineHeight: 1.75, maxWidth: 520, margin: '0 auto',
        }}>
          Your intro for the{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{candidate.jobTitle}</strong>{' '}
          position caught our attention. A member of the hiring team is personally
          reviewing your submission to make a more informed decision.
        </p>
      </div>

      {/* What this means */}
      <div className="glass-card-static" style={{ padding: '1.75rem' }}>
        <h3 style={{
          fontSize: '1rem', marginBottom: '1.15rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{ width: 4, height: 20, background: 'linear-gradient(#F59E0B, #EF4444)', borderRadius: 2, display: 'inline-block' }} />
          What This Means
        </h3>

        <p style={{
          color: 'var(--text-secondary)', fontSize: '0.9rem',
          lineHeight: 1.7, marginBottom: '1.25rem',
        }}>
          Some applications benefit from a personal review by a recruiter rather than
          a purely automated decision. This is a good sign — it means your submission
          warranted closer attention.
        </p>

        <div className="alert-warning" style={{ marginBottom: '1rem' }}>
          <Clock size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.15rem' }}>
              Expected timeline
            </p>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.55, opacity: 0.85 }}>
              Human reviews typically take 1-2 business days.{"You'll"} receive an
              email at <strong>{candidate.email}</strong> as soon as a decision is made.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <Link href="/jobs" className="btn-secondary" style={{ padding: '0.85rem 1.5rem' }}>
            <Briefcase size={15} /> Browse Other Roles
          </Link>
          <Link href="/support" className="btn-secondary" style={{ padding: '0.85rem 1.5rem' }}>
            <HelpCircle size={15} /> Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PENDING RESULT — Decision not ready yet
// Candidate arrived here before processing
// finished. Redirect them to the status page.
// ─────────────────────────────────────────────
function PendingResult({ token }: { token: string }) {
  return (
    <div className="glass-card-static" style={{
      padding: '3rem 2rem', textAlign: 'center',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(124,58,237,0.12)',
        border: '1px solid rgba(124,58,237,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.5rem',
      }}>
        <Clock size={30} color="#A78BFA" />
      </div>

      <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>
        Your result is not ready yet
      </h2>
      <p style={{
        color: 'var(--text-secondary)', fontSize: '0.92rem',
        lineHeight: 1.7, maxWidth: 440, margin: '0 auto 2rem',
      }}>
        {"We're still processing your application. You'll receive an email "}
        {"as soon as a decision is made. In the meantime, you can check your "}
        application status.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          href={`/status/${token}`}
          className="btn-primary"
          style={{ padding: '0.85rem 2rem' }}
        >
          <Clock size={16} /> Check Status
        </Link>
        <Link href="/jobs" className="btn-secondary" style={{ padding: '0.85rem 1.5rem' }}>
          <Briefcase size={15} /> Browse Roles
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN RESULT PAGE
// ─────────────────────────────────────────────
export default function ResultPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(() => {
    const candidateId = TOKEN_MAP[token];
    return candidateId ? MOCK_CANDIDATES.find(c => c.id === candidateId) ?? null : null;
  });

  useEffect(() => {
    fetchApplicationByToken(token).then(res => {
      if (res && res.candidate) {
        setCandidate(res.candidate);
        setLoading(false);
      } else {
        const candidateId = TOKEN_MAP[token];
        const cand = candidateId ? MOCK_CANDIDATES.find(c => c.id === candidateId) ?? null : null;
        if (cand) {
          setCandidate(cand);
        } else {
          setExpired(true);
        }
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });
  }, [token]);

  // Loading
  if (loading) {
    return (
      <>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1rem' }} />
            <div className="skeleton" style={{ width: 280, height: 20, margin: '0 auto 0.5rem' }} />
            <div className="skeleton" style={{ width: 200, height: 14, margin: '0 auto' }} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Expired / not found
  if (expired || !candidate) {
    return (
      <>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 460 }}>
            <div style={{
              width: 76, height: 76,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <AlertTriangle size={30} color="#FCD34D" />
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
              Link Expired
            </span>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
              {"We couldn't find this result"}
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem', fontSize: '0.9rem' }}>
              This link may have expired or the result token is invalid.
              Check your email for the correct link, or contact support.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/jobs" className="btn-primary">
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

  // Determine which result view to show
  const isPending = candidate.decision === 'pending';
  const isSelected = candidate.decision === 'selected';
  const isNotSelected = candidate.decision === 'not_selected';
  const isManualReview = candidate.decision === 'manual_review';

  // Submission date
  const submittedDate = new Date(candidate.submittedAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>

        {/* Top bar */}
        <div style={{
          background: isPending
            ? 'linear-gradient(180deg, rgba(124,58,237,0.04) 0%, transparent 100%)'
            : isSelected
              ? 'linear-gradient(180deg, rgba(16,185,129,0.05) 0%, transparent 100%)'
              : isManualReview
                ? 'linear-gradient(180deg, rgba(245,158,11,0.04) 0%, transparent 100%)'
                : 'linear-gradient(180deg, rgba(99,102,241,0.04) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '1.25rem 0',
        }}>
          <div className="container-lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                padding: '0.2rem 0.65rem',
                background: isSelected ? 'rgba(16,185,129,0.12)' : isManualReview ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
                border: `1px solid ${isSelected ? 'rgba(16,185,129,0.25)' : isManualReview ? 'rgba(245,158,11,0.25)' : 'rgba(99,102,241,0.25)'}`,
                borderRadius: 20,
                fontSize: '0.7rem', fontWeight: 700,
                color: isSelected ? '#34D399' : isManualReview ? '#FCD34D' : '#A5B4FC',
                letterSpacing: '0.04em',
              }}>
                APPLICATION RESULT
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                for {candidate.jobTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="container-lg" style={{ padding: '2rem 1.5rem 4rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 300px',
            gap: '2rem',
            alignItems: 'flex-start',
          }}>

            {/* Left column — Result content */}
            <div>
              {isPending && <PendingResult token={token} />}
              {isSelected && <SelectedResult candidate={candidate} />}
              {isNotSelected && <NotSelectedResult candidate={candidate} />}
              {isManualReview && <ManualReviewResult candidate={candidate} />}
            </div>

            {/* Right column — Sidebar */}
            <div style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Application summary */}
              <div className="glass-card-static" style={{ padding: '1.25rem' }}>
                <p style={{
                  fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.85rem',
                }}>
                  Application Summary
                </p>
                {[
                  { label: 'Position', value: candidate.jobTitle },
                  { label: 'Applied', value: submittedDate },
                  { label: 'Status', value: isPending ? 'Processing' : isSelected ? 'Selected' : isManualReview ? 'Under Review' : 'Reviewed' },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    fontSize: '0.82rem',
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <Link
                href={`/status/${token}`}
                className="glass-card"
                style={{
                  padding: '1.15rem 1.35rem',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none', color: 'var(--text-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Clock size={15} color="#A78BFA" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>View Status Timeline</span>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </Link>

              <Link
                href="/jobs"
                className="glass-card"
                style={{
                  padding: '1.15rem 1.35rem',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none', color: 'var(--text-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Briefcase size={15} color="#67E8F9" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Browse More Roles</span>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </Link>

              <Link
                href="/support"
                className="glass-card"
                style={{
                  padding: '1.15rem 1.35rem',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none', color: 'var(--text-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <HelpCircle size={15} color="#FCD34D" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Need Help?</span>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </Link>

              {/* Privacy */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.85rem 1.15rem',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.15)',
                borderRadius: 12,
              }}>
                <Shield size={15} color="#34D399" />
                <span style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 500 }}>
                  No AI scores are shown to candidates
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
