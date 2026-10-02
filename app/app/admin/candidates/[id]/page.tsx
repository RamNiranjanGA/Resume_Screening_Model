// ============================================================
// PAGE 12 — CANDIDATE DETAIL
// Route: /admin/candidates/[id]
//
// Purpose: Full deep-dive view of a single candidate's
// application. The recruiter can:
//   - See AI score breakdown and reasoning
//   - Read the full transcript of the candidate's submission
//   - Watch/listen to the recording (placeholder)
//   - Override the AI's decision with a manual decision
//   - View override audit trail if one exists
//
// ── Layout ───────────────────────────────────────────────────
//   AdminSidebar (left) + Main content area:
//     - Breadcrumb + candidate name header
//     - Two-column layout:
//       LEFT:  AI analysis card, transcript card
//       RIGHT: Candidate info card, recording player, override card
//
// ── States ───────────────────────────────────────────────────
//   1. found_decided      — candidate with AI score and reasoning
//   2. found_processing   — candidate still being analyzed by AI
//   3. found_received     — candidate queued, not yet processed
//   4. not_found          — invalid candidate ID
//   5. override_modal     — recruiter override form is open
//   6. override_saving    — override being submitted
//   7. override_saved     — override confirmed, banner shown
//
// ── Edge Cases ───────────────────────────────────────────────
//   - Candidate not found → friendly 404-like card
//   - Processing candidate → "AI is analyzing" state, no score
//   - Received candidate → "Queued" state, waiting in line
//   - No transcript available → placeholder message
//   - Override form requires reason (min 10 chars)
//   - Override replaces AI decision but keeps audit trail
//   - "Back to Pipeline" breadcrumb always works
//
// Functions:
//   CandidateDetailPage() — main page component
//   AIAnalysisCard()      — score ring + reasoning
//   TranscriptCard()      — full transcript with timestamp
//   CandidateInfoCard()   — personal info + metadata
//   RecordingCard()       — video/audio placeholder
//   OverrideCard()        — current override or button to open form
//   OverrideModal()       — modal form for new override
//   ScoreRing()           — circular SVG score indicator
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { getCandidateById, getJobById, getRelativeTime } from '@/lib/mock-data';
import { fetchCandidateById, updateCandidateManualOverride, fetchJobById } from '@/lib/db';
import { Candidate, DecisionType } from '@/lib/types';
import {
  ChevronLeft, User, Mail, Briefcase, Calendar,
  Brain, FileText, Video, Shield, ShieldCheck,
  AlertTriangle, CheckCircle2, XCircle, Clock,
  Loader, Eye, Sparkles, ArrowRight, X,
  Send, Edit3, Info, AlertCircle, Play,
  Volume2, Mic, RefreshCw, ExternalLink,
  Copy, Check
} from 'lucide-react';
import { getSignedRecordingUrl, isSignedUrl, isStoragePath } from '@/lib/storage';

// ─────────────────────────────────────────────
// SCORE RING — circular SVG progress indicator
// ─────────────────────────────────────────────
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? '#10B981' :
    score >= 60 ? '#FBBF24' :
    score >= 40 ? '#F97316' :
    '#EF4444';

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      {/* Center text */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 900, color, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: size * 0.1, color: 'var(--text-muted)', fontWeight: 600 }}>
          / 100
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DECISION BADGE (large version)
// ─────────────────────────────────────────────
function DecisionDisplay({ decision }: { decision: DecisionType }) {
  const config: Record<DecisionType, { label: string; className: string; icon: React.ReactNode; description: string }> = {
    selected:      { label: 'Selected',      className: 'badge badge-green',  icon: <CheckCircle2 size={14} />, description: 'This candidate meets or exceeds the role requirements.' },
    not_selected:  { label: 'Not Selected',  className: 'badge badge-red',    icon: <XCircle size={14} />,      description: 'This candidate does not meet the minimum requirements.' },
    pending:       { label: 'Pending',       className: 'badge badge-blue',   icon: <Clock size={14} />,        description: 'Decision is pending — AI analysis is not yet complete.' },
    manual_review: { label: 'Manual Review', className: 'badge badge-amber',  icon: <AlertTriangle size={14} />, description: 'AI flagged this candidate for human review due to a borderline score.' },
  };
  const { label, className, icon, description } = config[decision];

  return (
    <div>
      <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', padding: '0.35rem 0.9rem' }}>
        {icon} {label}
      </span>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// OVERRIDE MODAL
// ─────────────────────────────────────────────
function OverrideModal({
  currentDecision,
  onSubmit,
  onClose,
  isSaving,
}: {
  currentDecision: DecisionType;
  onSubmit: (decision: DecisionType, reason: string) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [decision, setDecision] = useState<DecisionType>(
    currentDecision === 'selected' ? 'not_selected' : 'selected'
  );
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (reason.trim().length < 10) {
      setError('Please provide a reason (at least 10 characters).');
      return;
    }
    setError('');
    onSubmit(decision, reason.trim());
  };

  const options: { value: DecisionType; label: string; color: string }[] = [
    { value: 'selected',      label: 'Selected — Advance to next round',     color: '#10B981' },
    { value: 'not_selected',  label: 'Not Selected — Decline candidate',     color: '#EF4444' },
    { value: 'manual_review', label: 'Manual Review — Hold for further review', color: '#F59E0B' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      padding: '1rem',
    }}>
      <div
        className="glass-card-static animate-fade-up"
        style={{ width: '100%', maxWidth: 520, padding: '2rem', position: 'relative' }}
        role="dialog"
        aria-modal="true"
        aria-label="Override AI decision"
      >
        {/* Close */}
        <button
          onClick={onClose}
          disabled={isSaving}
          aria-label="Close override dialog"
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} style={{ color: '#A78BFA' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Override AI Decision</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>This will be recorded in the audit trail.</p>
          </div>
        </div>

        {/* Decision options */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">New Decision</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {options.map(opt => (
              <label
                key={opt.value}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.75rem 1rem',
                  background: decision === opt.value ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${decision === opt.value ? 'rgba(124,58,237,0.3)' : 'var(--border-subtle)'}`,
                  borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <input
                  type="radio"
                  name="override-decision"
                  value={opt.value}
                  checked={decision === opt.value}
                  onChange={() => setDecision(opt.value)}
                  style={{ accentColor: opt.color }}
                />
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: decision === opt.value ? 600 : 400 }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <label htmlFor="override-reason" className="form-label" style={{ margin: 0 }}>Reason for Override *</label>
            <span style={{ fontSize: '0.72rem', color: reason.length >= 10 ? 'var(--text-muted)' : '#FBBF24' }}>
              {reason.length} / 500
            </span>
          </div>
          <textarea
            id="override-reason"
            className="form-input"
            placeholder="Explain why you are overriding the AI decision. This is recorded in the audit trail…"
            value={reason}
            onChange={e => { setReason(e.target.value); if (error) setError(''); }}
            rows={4}
            maxLength={500}
            style={{ resize: 'vertical', lineHeight: 1.6, borderColor: error ? 'var(--accent-red)' : undefined }}
          />
          {error && (
            <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', fontSize: '0.78rem', color: '#FCA5A5' }}>
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={isSaving} className="btn-secondary" style={{ padding: '0.65rem 1.25rem' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSaving} className="btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
            {isSaving ? (
              <><Loader size={15} style={{ animation: 'admin-spin 1s linear infinite' }} /> Submitting...</>
            ) : (
              <><ShieldCheck size={15} /> Confirm Override</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(getCandidateById(id) || null);
  const [job, setJob] = useState(candidate ? getJobById(candidate.jobId) : undefined);

  useEffect(() => {
    fetchCandidateById(id).then(cand => {
      if (cand) {
        setCandidate(cand);
        if (cand.manualOverride) setLocalOverride(cand.manualOverride);
        fetchJobById(cand.jobId).then(j => {
          if (j) setJob(j);
        });
      }
    });
  }, [id]);

  // Override state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [localOverride, setLocalOverride] = useState<{
    decision: DecisionType;
    reason: string;
    overriddenBy: string;
    overriddenAt: string;
  } | null>(candidate?.manualOverride ?? null);
  const [overrideSuccess, setOverrideSuccess] = useState(false);

  // Recording playback URL (may need refresh if signed URL expires)
  const [recordingPlayUrl, setRecordingPlayUrl] = useState<string>(
    candidate?.recordingUrl || ''
  );
  const [urlRefreshing, setUrlRefreshing] = useState(false);

  // Detect if the recording is video or audio based on URL/path
  const isVideoRecording = !recordingPlayUrl.includes('.mp3') &&
    !recordingPlayUrl.includes('.wav') &&
    !recordingPlayUrl.includes('.ogg') &&
    !recordingPlayUrl.includes('.m4a');

  // Refresh signed URL when it may have expired
  const handleRefreshUrl = async () => {
    if (!candidate?.recordingUrl) return;
    setUrlRefreshing(true);
    try {
      const rawUrl = candidate.recordingUrl;
      // If it's a storage path (not a full URL), generate a signed URL
      const pathToSign = isStoragePath(rawUrl)
        ? rawUrl
        : rawUrl.split('/object/sign/recordings/')[1]?.split('?')[0];
      if (pathToSign) {
        const fresh = await getSignedRecordingUrl(pathToSign);
        if (fresh) setRecordingPlayUrl(fresh);
      }
    } catch {}
    setUrlRefreshing(false);
  };

  // Sync playback URL when candidate loads from DB
  useEffect(() => {
    if (candidate?.recordingUrl) {
      setRecordingPlayUrl(candidate.recordingUrl);
    }
  }, [candidate?.recordingUrl]);

  // Effective decision (override takes precedence)
  const effectiveDecision = localOverride?.decision ?? candidate?.decision ?? 'pending';

  const handleOverrideSubmit = async (decision: DecisionType, reason: string) => {
    setOverrideSaving(true);
    const overrideRecord = {
      decision,
      reason,
      overriddenBy: 'admin@luminaryhire.com',
      overriddenAt: new Date().toISOString(),
    };

    // Save to Supabase (resilient with local update)
    await updateCandidateManualOverride(id, overrideRecord);

    setLocalOverride(overrideRecord);
    setCandidate(prev => prev ? { ...prev, decision, manualOverride: overrideRecord } : null);
    setOverrideSaving(false);
    setShowOverrideModal(false);
    setOverrideSuccess(true);
    setTimeout(() => setOverrideSuccess(false), 4000);
  };

  // ── Avatar helper ──
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : name.slice(0, 2);
  };
  const getAvatarColor = (name: string) => {
    const colors = ['#7C3AED', '#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  // ── NOT FOUND STATE ──
  if (!candidate) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <AdminSidebar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <User size={28} style={{ color: '#FCA5A5' }} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Candidate Not Found</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              No candidate with ID &ldquo;{id}&rdquo; exists in the system. They may have been removed or the link is incorrect.
            </p>
            <Link href="/admin/candidates" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              <ChevronLeft size={16} /> Back to Pipeline
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isProcessing = candidate.status === 'processing';
  const isReceived = candidate.status === 'received';
  const hasAnalysis = candidate.aiScore > 0 && candidate.aiReasoning;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <AdminSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── Page header ── */}
        <div style={{
          padding: '1.25rem 2rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255,255,255,0.01)',
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
            <Link href="/admin/candidates" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ChevronLeft size={14} /> Pipeline
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-secondary)' }}>{candidate.name}</span>
          </div>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: getAvatarColor(candidate.name),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1rem', fontWeight: 800, flexShrink: 0,
              }}>
                {getInitials(candidate.name)}
              </div>
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.15rem' }}>
                  {candidate.name}
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={12} /> {candidate.email}</span>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Briefcase size={12} /> {candidate.jobTitle}</span>
                </p>
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <Link href="/admin/candidates" className="btn-ghost" style={{ fontSize: '0.85rem' }}>
                <ChevronLeft size={14} /> Back to Pipeline
              </Link>
            </div>
          </div>
        </div>

        {/* Override success banner */}
        {overrideSuccess && (
          <div className="alert-success" style={{ margin: '1rem 2rem 0', alignItems: 'center' }} role="status">
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Decision override saved successfully. Audit trail updated.</span>
          </div>
        )}

        {/* ── Two-column content ── */}
        <div style={{ flex: 1, padding: '1.5rem 2rem 3rem', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start', maxWidth: 1280 }}>

          {/* ═══ LEFT COLUMN ═══ */}
          <div>

            {/* ── AI ANALYSIS CARD ── */}
            <div className="glass-card-static" style={{ padding: '1.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA' }}>
                  <Brain size={17} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>AI Analysis</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automated scoring and reasoning</p>
                </div>
              </div>

              {isProcessing ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <Loader size={36} style={{ animation: 'admin-spin 1.5s linear infinite', color: '#818CF8', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>AI is analyzing this submission</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    This usually takes 2–5 minutes. Score and reasoning will appear here when complete.
                  </p>
                </div>
              ) : isReceived ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <Clock size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>Queued for Analysis</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    This submission is in the queue. AI analysis will begin shortly.
                  </p>
                </div>
              ) : hasAnalysis ? (
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Score ring */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <ScoreRing score={candidate.aiScore} />
                    <DecisionDisplay decision={effectiveDecision} />
                  </div>

                  {/* Reasoning */}
                  <div style={{ flex: 1, minWidth: 250 }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sparkles size={14} style={{ color: '#A78BFA' }} /> AI Reasoning
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                      {candidate.aiReasoning}
                    </p>

                    {/* Skills matched info */}
                    {job && job.mustHaveSkills.length > 0 && (
                      <div style={{ marginTop: '1.25rem' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                          Required Skills for This Role
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {job.mustHaveSkills.map((s, i) => (
                            <span key={i} className="badge badge-purple" style={{ fontSize: '0.72rem' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <Info size={28} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No AI analysis data available.</p>
                </div>
              )}
            </div>

            {/* ── TRANSCRIPT CARD ── */}
            <div className="glass-card-static" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#67E8F9' }}>
                  <FileText size={17} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Transcript</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI-generated from candidate&apos;s recording</p>
                </div>
              </div>

              {candidate.transcript ? (
                <div style={{
                  padding: '1.25rem 1.5rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12, borderLeft: '3px solid rgba(124,58,237,0.4)',
                }}>
                  <p style={{
                    fontSize: '0.9rem', color: 'var(--text-secondary)',
                    lineHeight: 1.85, fontStyle: 'italic',
                    whiteSpace: 'pre-wrap',
                  }}>
                    &ldquo;{candidate.transcript}&rdquo;
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <FileText size={28} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '0.75rem' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {isProcessing ? 'Transcript will be generated once AI analysis completes.' : 'No transcript available yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div>

            {/* ── CANDIDATE APPLICATION FORM CARD ── */}
            <div className="glass-card-static" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                  Candidate Profile Form
                </h3>
                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                  Verified Applicant
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <div style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }}><User size={14} /></div>
                  <div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>Full Name</p>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{candidate.name}</p>
                  </div>
                </div>

                {/* Email with copy & mail actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <div style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }}><Mail size={14} /></div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>Email Address</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <a href={`mailto:${candidate.email}`} style={{ fontSize: '0.88rem', color: '#67E8F9', textDecoration: 'none' }}>
                        {candidate.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Job */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <div style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }}><Briefcase size={14} /></div>
                  <div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>Applied Role</p>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{candidate.jobTitle}</p>
                  </div>
                </div>

                {/* Submitted */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <div style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }}><Calendar size={14} /></div>
                  <div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>Submitted</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {getRelativeTime(candidate.submittedAt)} — {new Date(candidate.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct email button */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.5rem' }}>
                <a
                  href={`mailto:${candidate.email}?subject=Regarding your application for ${encodeURIComponent(candidate.jobTitle)} at LuminaryHire`}
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.55rem', fontSize: '0.82rem' }}
                >
                  <Mail size={13} /> Email Candidate
                </a>
              </div>

              {/* Link to job */}
              {job && (
                <Link
                  href={`/jobs/${job.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    marginTop: '0.5rem', padding: '0.5rem 0.75rem',
                    background: 'rgba(124,58,237,0.06)',
                    border: '1px solid rgba(124,58,237,0.15)',
                    borderRadius: 8, fontSize: '0.8rem', color: '#A78BFA',
                    textDecoration: 'none', fontWeight: 600,
                  }}
                >
                  <Eye size={13} /> View Job Listing <ArrowRight size={12} />
                </Link>
              )}
            </div>

            {/* ── RECORDING CARD ── */}
            <div className="glass-card-static" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Recording
                </h3>
                {recordingPlayUrl && (
                  <button
                    onClick={handleRefreshUrl}
                    disabled={urlRefreshing}
                    title="Refresh signed URL"
                    style={{ background: 'none', border: 'none', cursor: urlRefreshing ? 'wait' : 'pointer', color: 'var(--text-muted)', padding: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}
                  >
                    {urlRefreshing
                      ? <Loader size={12} style={{ animation: 'admin-spin 1s linear infinite' }} />
                      : <RefreshCw size={12} />}
                    {urlRefreshing ? 'Refreshing…' : 'Refresh URL'}
                  </button>
                )}
              </div>

              {recordingPlayUrl ? (
                <div>
                  {isVideoRecording ? (
                    <video
                      src={recordingPlayUrl}
                      controls
                      preload="metadata"
                      style={{
                        width: '100%', borderRadius: 10,
                        background: '#000',
                        maxHeight: 260,
                        border: '1px solid var(--border-subtle)',
                      }}
                    />
                  ) : (
                    <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Mic size={14} style={{ color: '#67E8F9' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Audio Recording</span>
                      </div>
                      <audio
                        src={recordingPlayUrl}
                        controls
                        preload="metadata"
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                  <a
                    href={recordingPlayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem', fontSize: '0.75rem', color: '#A78BFA', textDecoration: 'none' }}
                  >
                    <ExternalLink size={11} /> Open in new tab
                  </a>
                </div>
              ) : (
                <div style={{ padding: '2rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                    <Play size={20} style={{ color: '#A78BFA', marginLeft: 2 }} />
                  </div>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>No Recording Available</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    The recording URL will appear here once the candidate submits their application.
                  </p>
                </div>
              )}
            </div>

            {/* ── OVERRIDE / AUDIT CARD ── */}
            <div className="glass-card-static" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Recruiter Override
                </h3>
                <Shield size={15} style={{ color: '#A78BFA' }} />
              </div>

              {localOverride ? (
                /* Existing override — show audit trail */
                <div>
                  <div style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(124,58,237,0.06)',
                    border: '1px solid rgba(124,58,237,0.15)',
                    borderRadius: 10, marginBottom: '0.85rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                      <ShieldCheck size={14} style={{ color: '#A78BFA' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#A78BFA' }}>Override Active</span>
                    </div>
                    <DecisionDisplay decision={localOverride.decision} />
                  </div>

                  {/* Reason */}
                  <div style={{ marginBottom: '0.85rem' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Reason</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {localOverride.reason}
                    </p>
                  </div>

                  {/* Audit info */}
                  <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <p>By: <strong style={{ color: 'var(--text-secondary)' }}>{localOverride.overriddenBy}</strong></p>
                    <p>At: {new Date(localOverride.overriddenAt).toLocaleString('en-IN')}</p>
                  </div>

                  {/* Re-override button */}
                  <button
                    onClick={() => setShowOverrideModal(true)}
                    className="btn-ghost"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '0.85rem', fontSize: '0.82rem' }}
                  >
                    <Edit3 size={13} /> Change Override
                  </button>
                </div>
              ) : hasAnalysis ? (
                /* No override yet — show override button */
                <div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
                    The AI assigned this candidate a score of <strong style={{ color: 'var(--text-primary)' }}>{candidate.aiScore}/100</strong>. 
                    You can override this decision if you disagree with the AI&apos;s assessment.
                  </p>
                  <button
                    id="override-btn"
                    onClick={() => setShowOverrideModal(true)}
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.7rem' }}
                  >
                    <ShieldCheck size={15} /> Override AI Decision
                  </button>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.6rem' }}>
                    All overrides are recorded in the audit trail.
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Override is available after AI analysis completes.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Override modal */}
      {showOverrideModal && (
        <OverrideModal
          currentDecision={effectiveDecision}
          onSubmit={handleOverrideSubmit}
          onClose={() => setShowOverrideModal(false)}
          isSaving={overrideSaving}
        />
      )}

      <style jsx global>{`
        @keyframes admin-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
