'use client';

// ============================================================
// PAGE 2 — JOB LISTINGS
// Route: /jobs
//
// Purpose: Browse all open job postings. Candidates can search
// by keyword and filter by location + role type.
//
// States handled:
//   1. loading     — skeleton cards (simulated 1.2s delay)
//   2. populated   — job cards with apply button
//   3. empty       — "No jobs match your filters" with clear CTA
//   4. error       — failed fetch, shows retry button
//
// Functions:
//   loadJobs()         — simulates async DB fetch with delay
//   handleSearch()     — filters jobs by keyword against title/company/summary
//   handleFilter()     — filters by location and job type dropdowns
//   handleRetry()      — resets error state and re-fetches
//   clearFilters()     — resets all filter state to defaults
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { MOCK_JOBS } from '@/lib/mock-data';
import { fetchJobs } from '@/lib/db';
import { Job, JobType } from '@/lib/types';
import {
  Search, MapPin, Briefcase, Users, Clock,
  ArrowRight, AlertCircle, RefreshCw, X,
  SlidersHorizontal, Building2, ChevronDown
} from 'lucide-react';

// ── Badge colour map keyed by job type ──
const TYPE_COLORS: Record<JobType, { bg: string; text: string; border: string }> = {
  'full-time':  { bg: 'rgba(124,58,237,0.12)',  text: '#A78BFA', border: 'rgba(124,58,237,0.25)' },
  'part-time':  { bg: 'rgba(6,182,212,0.12)',   text: '#67E8F9', border: 'rgba(6,182,212,0.25)' },
  'contract':   { bg: 'rgba(245,158,11,0.12)',  text: '#FCD34D', border: 'rgba(245,158,11,0.25)' },
  'remote':     { bg: 'rgba(16,185,129,0.12)',  text: '#34D399', border: 'rgba(16,185,129,0.25)' },
  'hybrid':     { bg: 'rgba(99,102,241,0.12)',  text: '#A5B4FC', border: 'rgba(99,102,241,0.25)' },
};

const TYPE_LABELS: Record<JobType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  'contract':  'Contract',
  'remote':    'Remote',
  'hybrid':    'Hybrid',
};

// ── Unique locations extracted from mock data ──
// Guard: exclude any value that is a job-type keyword (e.g. 'Remote').
// Location should always be a real city — work style lives in the Type filter.
const JOB_TYPE_WORDS = new Set(['remote', 'hybrid', 'full-time', 'part-time', 'contract']);
const ALL_LOCATIONS = [
  'All Locations',
  ...Array.from(
    new Set(
      MOCK_JOBS
        .map(j => j.location)
        .filter(loc => !JOB_TYPE_WORDS.has(loc.toLowerCase()))
    )
  ).sort(),
];
const ALL_TYPES: (JobType | 'all')[] = ['all', 'full-time', 'part-time', 'contract', 'remote', 'hybrid'];

type PageState = 'loading' | 'populated' | 'empty' | 'error';

// ─────────────────────────────────────────────
// SKELETON CARD — shown during loading state
// Mimics the shape of a real job card
// ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="glass-card-static" style={{ padding: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <div className="skeleton" style={{ width: 200, height: 20, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 140, height: 15 }} />
        </div>
        <div className="skeleton" style={{ width: 70, height: 26, borderRadius: 20 }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: 14, marginBottom: 6 }} />
      <div className="skeleton" style={{ width: '80%', height: 14, marginBottom: '1.5rem' }} />
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div className="skeleton" style={{ width: 110, height: 14 }} />
        <div className="skeleton" style={{ width: 90, height: 14 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 80, height: 14 }} />
        <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 20 }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// JOB CARD — populated state
// Shows: title, company, location, type badge,
// summary, applicant count, posted date, Apply btn
// ─────────────────────────────────────────────
function JobCard({ job }: { job: Job }) {
  const colors = TYPE_COLORS[job.type];
  const daysAgo = Math.floor((Date.now() - new Date(job.postedAt).getTime()) / 86400000);
  const postedLabel = daysAgo === 0 ? 'Posted today' : `Posted ${daysAgo}d ago`;

  return (
    <div
      className="glass-card"
      style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      {/* Top row: title + type badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem', lineHeight: 1.3 }}>
            {job.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Building2 size={13} />
            <span>{job.company}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{job.department}</span>
          </div>
        </div>
        {/* Type badge */}
        <span style={{
          flexShrink: 0,
          padding: '0.3rem 0.75rem',
          borderRadius: 20,
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.03em',
          background: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          whiteSpace: 'nowrap',
        }}>
          {TYPE_LABELS[job.type]}
        </span>
      </div>

      {/* Summary */}
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
        {job.summary}
      </p>

      {/* Meta row: location + applicants */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          <MapPin size={13} /> {job.location}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          <Users size={13} /> {job.applicantCount} applicants
        </span>
        {job.salary && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <Briefcase size={13} /> {job.salary}
          </span>
        )}
      </div>

      {/* Divider */}
      <hr className="divider" style={{ margin: '0' }} />

      {/* Bottom row: posted time + apply btn */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <Clock size={12} /> {postedLabel}
        </span>
        <Link
          href={`/jobs/${job.id}`}
          className="btn-primary"
          style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
          id={`apply-btn-${job.id}`}
        >
          View & Apply <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function JobsPage() {
  const [pageState, setPageState]     = useState<PageState>('loading');
  const [jobs, setJobs]               = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [typeFilter, setTypeFilter]   = useState<JobType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // ── Supabase + fallback fetch ──
  const loadJobs = useCallback(async (simulateError = false) => {
    setPageState('loading');
    if (simulateError) {
      await new Promise(r => setTimeout(r, 600));
      setPageState('error');
      return;
    }
    try {
      const data = await fetchJobs();
      setJobs(data.filter(j => j.status === 'published'));
      setPageState('populated');
    } catch {
      setPageState('error');
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // ── Client-side search + filter logic ──
  // Runs on every render — fast since data is in memory
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Keyword search: checks title, company, department, summary
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || [job.title, job.company, job.department, job.summary]
        .some(field => field.toLowerCase().includes(q));

      // Location filter
      const matchesLocation = locationFilter === 'All Locations' || job.location === locationFilter;

      // Type filter
      const matchesType = typeFilter === 'all' || job.type === typeFilter;

      return matchesSearch && matchesLocation && matchesType;
    });
  }, [jobs, searchQuery, locationFilter, typeFilter]);

  // Determine which state to show
  const displayState: PageState =
    pageState === 'loading' ? 'loading' :
    pageState === 'error'   ? 'error'   :
    filteredJobs.length === 0 ? 'empty' : 'populated';

  const hasActiveFilters = searchQuery || locationFilter !== 'All Locations' || typeFilter !== 'all';

  function clearFilters() {
    setSearchQuery('');
    setLocationFilter('All Locations');
    setTypeFilter('all');
  }

  // Dynamic locations list merging mock jobs and newly posted jobs
  const allLocations = useMemo(() => {
    return [
      'All Locations',
      ...Array.from(
        new Set(
          [...MOCK_JOBS, ...jobs]
            .map(j => j.location)
            .filter(loc => loc && !JOB_TYPE_WORDS.has(loc.toLowerCase()))
        )
      ).sort(),
    ];
  }, [jobs]);

  return (
    <>
      <Header />
      <main style={{ flex: 1, minHeight: '80vh' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(124,58,237,0.08) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '3rem 0 2rem',
        }}>
          <div className="container-xl">
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              Open Positions
            </p>
            <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', marginBottom: '0.5rem' }}>
              Find your next role
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              {pageState === 'populated'
                ? `${jobs.length} open positions · Apply with a 60-second video intro`
                : 'Apply with a 60-second video intro — no résumé required'}
            </p>
          </div>
        </div>

        {/* ── SEARCH + FILTERS ── */}
        <div style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
          padding: '1.25rem 0',
          position: 'sticky',
          top: 68,
          zIndex: 50,
          backdropFilter: 'blur(20px)',
        }}>
          <div className="container-xl">
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>

              {/* Search bar */}
              <div className="search-wrapper" style={{ flex: '1 1 280px', minWidth: 200 }}>
                <Search size={16} className="search-icon" />
                <input
                  id="job-search"
                  type="text"
                  className="search-input"
                  placeholder="Search by title, company, or keyword…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  aria-label="Search jobs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute', right: '0.75rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: '0.2rem',
                      display: 'flex', alignItems: 'center',
                    }}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Location filter */}
              <div style={{ position: 'relative', minWidth: 160 }}>
                <select
                  id="location-filter"
                  className="form-select"
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  aria-label="Filter by location"
                  style={{ paddingLeft: '2.2rem' }}
                >
                  {allLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <MapPin size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>

              {/* Role type filter */}
              <div style={{ position: 'relative', minWidth: 150 }}>
                <select
                  id="type-filter"
                  className="form-select"
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as JobType | 'all')}
                  aria-label="Filter by role type"
                  style={{ paddingLeft: '2.2rem' }}
                >
                  <option value="all">All Types</option>
                  {ALL_TYPES.filter(t => t !== 'all').map(t => (
                    <option key={t} value={t}>{TYPE_LABELS[t as JobType]}</option>
                  ))}
                </select>
                <Briefcase size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>

              {/* Clear filters button — only visible when filters are active */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="btn-ghost"
                  style={{ color: '#A78BFA', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                  id="clear-filters-btn"
                >
                  <X size={14} /> Clear filters
                </button>
              )}
            </div>

            {/* Active filter summary */}
            {displayState === 'populated' && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing <strong style={{ color: 'var(--text-secondary)' }}>{filteredJobs.length}</strong> of{' '}
                <strong style={{ color: 'var(--text-secondary)' }}>{jobs.length}</strong> positions
                {hasActiveFilters && ' · filtered'}
              </p>
            )}
          </div>
        </div>

        {/* ── JOB GRID ── */}
        <div className="container-xl" style={{ padding: '2.5rem 1.5rem' }}>

          {/* ── STATE: LOADING ── */}
          {displayState === 'loading' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* ── STATE: POPULATED ── */}
          {displayState === 'populated' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {filteredJobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {/* ── STATE: EMPTY / NO RESULTS ── */}
          {displayState === 'empty' && (
            <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
              <div style={{
                width: 72, height: 72,
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}>
                <Search size={28} color="#A78BFA" />
              </div>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>
                No jobs match your filters
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 400, margin: '0 auto 2rem' }}>
                Try adjusting your search terms, changing the location, or clearing your filters to see all available roles.
              </p>
              <button
                onClick={clearFilters}
                className="btn-primary"
                id="empty-clear-filters-btn"
              >
                Clear all filters <X size={16} />
              </button>
            </div>
          )}

          {/* ── STATE: ERROR ── */}
          {displayState === 'error' && (
            <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
              <div style={{
                width: 72, height: 72,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}>
                <AlertCircle size={28} color="#FCA5A5" />
              </div>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>
                Failed to load jobs
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 400, margin: '0 auto 2rem' }}>
                We couldn't load the job listings right now. This is usually temporary — please try again.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => loadJobs()}
                  className="btn-primary"
                  id="retry-load-btn"
                >
                  <RefreshCw size={16} /> Try again
                </button>
                <Link href="/support" className="btn-secondary">
                  Contact support
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── BOTTOM CTA — only when populated ── */}
        {displayState === 'populated' && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '3rem 0', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Don't see a role that fits? We're always growing.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Check back soon — new positions are posted weekly.
            </p>
          </div>
        )}

      </main>
      <Footer />
    </>
  );
}
