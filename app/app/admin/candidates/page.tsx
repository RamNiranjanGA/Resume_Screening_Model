// ============================================================
// PAGE 11 — CANDIDATES DASHBOARD
// Route: /admin/candidates
//
// Purpose: The recruiter's primary command centre. Displays all
// candidate applications in a searchable, filterable table with
// stat cards, AI score indicators, and quick actions.
//
// ── Layout ───────────────────────────────────────────────────
//   AdminSidebar (left) + Main dashboard area:
//     - Stats cards row (top)
//     - Filter/search bar
//     - Candidates data table
//
// ── Stats Cards ──────────────────────────────────────────────
//   1. Total Candidates      (all)
//   2. Selected              (decision = selected)
//   3. Not Selected          (decision = not_selected)
//   4. Needs Review          (decision = manual_review)
//   5. In Pipeline           (status = received | processing)
//
// ── Table Columns ────────────────────────────────────────────
//   - Candidate Name + Email
//   - Job Applied For
//   - AI Score (colour-coded bar)
//   - Status badge (received / processing / decided)
//   - Decision badge (selected / not_selected / pending / manual_review)
//   - Submitted date (relative)
//   - Action → View Detail (link to /admin/candidates/[id])
//
// ── Filters ──────────────────────────────────────────────────
//   - Search by name or email (text input)
//   - Filter by job title (select)
//   - Filter by decision (select)
//   - Filter by status (select)
//   - Sort by: date (newest first), AI score (highest first), name (A-Z)
//
// ── States ───────────────────────────────────────────────────
//   1. populated        — table has matching candidates
//   2. empty_search     — no candidates match the search/filters
//   3. all_empty        — no candidates at all (edge case)
//
// ── Edge Cases ───────────────────────────────────────────────
//   - AI score = 0 → show "Pending" instead of empty bar
//   - Candidates in "processing" → show animated spinner instead of score
//   - Search is case-insensitive and matches name OR email
//   - Filters stack (search + job + decision can all be active)
//   - Empty filter results show friendly message + clear button
//   - Override badge shown when manualOverride is present
//
// Functions:
//   CandidatesDashboard()  — main page component
//   StatCard()             — single metric card
//   ScoreBar()             — horizontal AI score indicator
//   StatusBadge()          — status pill
//   DecisionBadge()        — decision pill
//   EmptyState()           — no results illustration
// ============================================================

'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { MOCK_CANDIDATES, MOCK_JOBS, getRelativeTime } from '@/lib/mock-data';
import { fetchCandidates } from '@/lib/db';
import { Candidate, DecisionType, ApplicationStatus } from '@/lib/types';
import {
  Users, CheckCircle2, XCircle, AlertTriangle, Clock,
  Search, Filter, ArrowUpDown, ChevronRight, Loader,
  Eye, Sparkles, ShieldCheck, BarChart3, UserCheck,
  UserX, UserCog, Inbox, X, ArrowRight
} from 'lucide-react';

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
function StatCard({
  label, value, icon, color, bgColor, borderColor, subtitle,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  subtitle?: string;
}) {
  return (
    <div className="glass-card-static" style={{
      padding: '1.25rem 1.5rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      flex: 1, minWidth: 170,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: bgColor, border: `1px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '0.15rem' }}>
          {value}
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {label}
        </p>
        {subtitle && (
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7 }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AI SCORE BAR
// ─────────────────────────────────────────────
function ScoreBar({ score, status }: { score: number; status: ApplicationStatus }) {
  if (status === 'processing') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Loader size={13} style={{ animation: 'admin-spin 1s linear infinite', color: '#818CF8' }} />
        <span style={{ fontSize: '0.78rem', color: '#818CF8', fontWeight: 600 }}>Analyzing…</span>
      </div>
    );
  }

  if (score === 0 && status === 'received') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Clock size={13} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Queued</span>
      </div>
    );
  }

  const color =
    score >= 80 ? '#10B981' :
    score >= 60 ? '#FBBF24' :
    score >= 40 ? '#F97316' :
    '#EF4444';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 110 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 3,
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden', maxWidth: 70,
      }}>
        <div style={{
          width: `${score}%`, height: '100%',
          background: color, borderRadius: 3,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{
        fontSize: '0.82rem', fontWeight: 700, color,
        fontVariantNumeric: 'tabular-nums', minWidth: 28,
      }}>
        {score}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config: Record<ApplicationStatus, { label: string; className: string }> = {
    received:   { label: 'Received',   className: 'badge badge-blue' },
    processing: { label: 'Processing', className: 'badge badge-purple' },
    decided:    { label: 'Decided',    className: 'badge badge-green' },
    expired:    { label: 'Expired',    className: 'badge badge-red' },
  };
  const { label, className } = config[status];
  return <span className={className}>{label}</span>;
}

// ─────────────────────────────────────────────
// DECISION BADGE
// ─────────────────────────────────────────────
function DecisionBadge({ decision, hasOverride }: { decision: DecisionType; hasOverride: boolean }) {
  const config: Record<DecisionType, { label: string; className: string; icon: React.ReactNode }> = {
    selected:      { label: 'Selected',     className: 'badge badge-green',  icon: <CheckCircle2 size={11} /> },
    not_selected:  { label: 'Not Selected', className: 'badge badge-red',    icon: <XCircle size={11} /> },
    pending:       { label: 'Pending',      className: 'badge badge-blue',   icon: <Clock size={11} /> },
    manual_review: { label: 'Manual Review',className: 'badge badge-amber',  icon: <AlertTriangle size={11} /> },
  };
  const { label, className, icon } = config[decision];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
      <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        {icon} {label}
      </span>
      {hasOverride && (
        <span title="Manual override applied" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ShieldCheck size={13} style={{ color: '#818CF8' }} />
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'rgba(124,58,237,0.1)',
        border: '1px solid rgba(124,58,237,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.25rem',
      }}>
        <Inbox size={28} style={{ color: '#A78BFA' }} />
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        {hasFilters ? 'No candidates match your filters' : 'No candidates yet'}
      </h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto', marginBottom: '1.25rem' }}>
        {hasFilters
          ? 'Try adjusting your search or filters to find candidates.'
          : 'Candidates will appear here once they submit video applications through your job listings.'}
      </p>
      {hasFilters && (
        <button onClick={onClear} className="btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
          <X size={15} /> Clear All Filters
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SORT OPTIONS
// ─────────────────────────────────────────────
type SortKey = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc' | 'name_asc' | 'name_desc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date_desc',  label: 'Newest First' },
  { value: 'date_asc',   label: 'Oldest First' },
  { value: 'score_desc', label: 'Highest Score' },
  { value: 'score_asc',  label: 'Lowest Score' },
  { value: 'name_asc',   label: 'Name A–Z' },
  { value: 'name_desc',  label: 'Name Z–A' },
];

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function CandidatesDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES);

  useEffect(() => {
    fetchCandidates().then(data => {
      if (data && data.length > 0) setCandidates(data);
    });
  }, []);

  // ── Filters ──
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJob, setFilterJob]           = useState('');
  const [filterDecision, setFilterDecision] = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [sortBy, setSortBy]                 = useState<SortKey>('date_desc');

  // ── Stats (computed from unfiltered data) ──
  const stats = useMemo(() => ({
    total:        candidates.length,
    selected:     candidates.filter(c => c.decision === 'selected').length,
    notSelected:  candidates.filter(c => c.decision === 'not_selected').length,
    manualReview: candidates.filter(c => c.decision === 'manual_review').length,
    pipeline:     candidates.filter(c => c.status === 'received' || c.status === 'processing').length,
  }), [candidates]);

  // ── Unique job titles for filter dropdown ──
  const jobTitles = useMemo(() =>
    Array.from(new Set(candidates.map(c => c.jobTitle))).sort(),
    [candidates]
  );

  // ── Apply filters + sort ──
  const filtered = useMemo(() => {
    let result = [...candidates];

    // Search (name or email, case-insensitive)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }

    // Job filter
    if (filterJob) {
      result = result.filter(c => c.jobTitle === filterJob);
    }

    // Decision filter
    if (filterDecision) {
      result = result.filter(c => c.decision === filterDecision);
    }

    // Status filter
    if (filterStatus) {
      result = result.filter(c => c.status === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc': return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        case 'date_asc':  return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        case 'score_desc': return b.aiScore - a.aiScore;
        case 'score_asc':  return a.aiScore - b.aiScore;
        case 'name_asc':   return a.name.localeCompare(b.name);
        case 'name_desc':  return b.name.localeCompare(a.name);
        default: return 0;
      }
    });

    return result;
  }, [candidates, searchQuery, filterJob, filterDecision, filterStatus, sortBy]);

  const hasFilters = !!(searchQuery || filterJob || filterDecision || filterStatus);
  const activeFilterCount = [searchQuery, filterJob, filterDecision, filterStatus].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setFilterJob('');
    setFilterDecision('');
    setFilterStatus('');
  };

  // ── Name initials for avatar ──
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : name.slice(0, 2);
  };

  // ── Avatar colour from name hash ──
  const getAvatarColor = (name: string) => {
    const colors = ['#7C3AED', '#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <AdminSidebar />

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Page header */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.01)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dashboard</span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Candidates</span>
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Candidate Pipeline
            </h1>
          </div>

          <Link href="/admin/jobs/new" className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}>
            <Sparkles size={15} />
            Post a Job
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Dashboard body */}
        <div style={{ flex: 1, padding: '1.5rem 2rem 3rem', maxWidth: 1280 }}>

          {/* ── STAT CARDS ── */}
          <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <StatCard
              label="Total Candidates"
              value={stats.total}
              icon={<Users size={20} />}
              color="#A78BFA" bgColor="rgba(124,58,237,0.12)" borderColor="rgba(124,58,237,0.25)"
            />
            <StatCard
              label="Selected"
              value={stats.selected}
              icon={<UserCheck size={20} />}
              color="#34D399" bgColor="rgba(16,185,129,0.12)" borderColor="rgba(16,185,129,0.25)"
            />
            <StatCard
              label="Not Selected"
              value={stats.notSelected}
              icon={<UserX size={20} />}
              color="#FCA5A5" bgColor="rgba(239,68,68,0.1)" borderColor="rgba(239,68,68,0.2)"
            />
            <StatCard
              label="Needs Review"
              value={stats.manualReview}
              icon={<UserCog size={20} />}
              color="#FBBF24" bgColor="rgba(245,158,11,0.1)" borderColor="rgba(245,158,11,0.2)"
              subtitle="Flagged by AI"
            />
            <StatCard
              label="In Pipeline"
              value={stats.pipeline}
              icon={<Clock size={20} />}
              color="#818CF8" bgColor="rgba(99,102,241,0.1)" borderColor="rgba(99,102,241,0.2)"
              subtitle="Received + Processing"
            />
          </div>

          {/* ── SEARCH & FILTER BAR ── */}
          <div className="glass-card-static" style={{
            padding: '1rem 1.25rem', marginBottom: '1.25rem',
            display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap',
          }}>
            {/* Search */}
            <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
              <Search size={15} className="search-icon" />
              <input
                id="candidate-search"
                type="text"
                className="search-input"
                placeholder="Search by name or email…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search candidates by name or email"
              />
            </div>

            {/* Job filter */}
            <select
              id="filter-job"
              className="form-select"
              value={filterJob}
              onChange={e => setFilterJob(e.target.value)}
              style={{ width: 'auto', minWidth: 160, padding: '0.6rem 2rem 0.6rem 0.75rem', fontSize: '0.85rem' }}
              aria-label="Filter by job title"
            >
              <option value="">All Jobs</option>
              {jobTitles.map(j => <option key={j} value={j}>{j}</option>)}
            </select>

            {/* Decision filter */}
            <select
              id="filter-decision"
              className="form-select"
              value={filterDecision}
              onChange={e => setFilterDecision(e.target.value)}
              style={{ width: 'auto', minWidth: 140, padding: '0.6rem 2rem 0.6rem 0.75rem', fontSize: '0.85rem' }}
              aria-label="Filter by decision"
            >
              <option value="">All Decisions</option>
              <option value="selected">Selected</option>
              <option value="not_selected">Not Selected</option>
              <option value="manual_review">Manual Review</option>
              <option value="pending">Pending</option>
            </select>

            {/* Status filter */}
            <select
              id="filter-status"
              className="form-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ width: 'auto', minWidth: 130, padding: '0.6rem 2rem 0.6rem 0.75rem', fontSize: '0.85rem' }}
              aria-label="Filter by application status"
            >
              <option value="">All Statuses</option>
              <option value="received">Received</option>
              <option value="processing">Processing</option>
              <option value="decided">Decided</option>
            </select>

            {/* Sort */}
            <select
              id="sort-candidates"
              className="form-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              style={{ width: 'auto', minWidth: 140, padding: '0.6rem 2rem 0.6rem 0.75rem', fontSize: '0.85rem' }}
              aria-label="Sort candidates"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Active filter count + clear */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.5rem 0.85rem',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 'var(--radius-full)',
                  color: '#FCA5A5', fontSize: '0.78rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                }}
                aria-label="Clear all filters"
              >
                <X size={13} /> Clear ({activeFilterCount})
              </button>
            )}
          </div>

          {/* ── Results count ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Showing <strong style={{ color: 'var(--text-secondary)' }}>{filtered.length}</strong> of {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* ── TABLE ── */}
          {filtered.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
          ) : (
            <div className="glass-card-static" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: 800 }}>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: '1.25rem', width: '25%' }}>Candidate</th>
                      <th style={{ width: '20%' }}>Job Applied</th>
                      <th style={{ width: '12%' }}>AI Score</th>
                      <th style={{ width: '10%' }}>Status</th>
                      <th style={{ width: '15%' }}>Decision</th>
                      <th style={{ width: '10%' }}>Submitted</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id} style={{ cursor: 'pointer' }}>
                        {/* Candidate name + email */}
                        <td style={{ paddingLeft: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {/* Avatar */}
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: getAvatarColor(c.name),
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: '0.72rem', fontWeight: 800,
                              flexShrink: 0, letterSpacing: '0.03em',
                            }}>
                              {getInitials(c.name)}
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.1rem' }}>
                                {c.name}
                              </p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Job */}
                        <td>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.jobTitle}</p>
                        </td>

                        {/* AI Score */}
                        <td>
                          <ScoreBar score={c.aiScore} status={c.status} />
                        </td>

                        {/* Status */}
                        <td><StatusBadge status={c.status} /></td>

                        {/* Decision */}
                        <td>
                          <DecisionBadge decision={c.decision} hasOverride={!!c.manualOverride} />
                        </td>

                        {/* Date */}
                        <td>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {getRelativeTime(c.submittedAt)}
                          </span>
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: 'center' }}>
                          <Link
                            href={`/admin/candidates/${c.id}`}
                            aria-label={`View details for ${c.name}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.4rem 0.75rem',
                              background: 'rgba(124,58,237,0.1)',
                              border: '1px solid rgba(124,58,237,0.2)',
                              borderRadius: 'var(--radius-full)',
                              color: '#A78BFA', fontSize: '0.78rem', fontWeight: 600,
                              textDecoration: 'none',
                              transition: 'all 0.2s',
                            }}
                          >
                            <Eye size={13} /> View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div style={{
                padding: '0.85rem 1.25rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                  {hasFilters && ` (filtered from ${candidates.length})`}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Sparkles size={12} style={{ color: '#A78BFA' }} />
                  AI scores refresh as new submissions are processed
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spinner keyframe */}
      <style jsx global>{`
        @keyframes admin-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
