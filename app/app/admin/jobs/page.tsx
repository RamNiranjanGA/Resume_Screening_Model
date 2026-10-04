// ============================================================
// PAGE — ADMIN JOBS DASHBOARD
// Route: /admin/jobs
//
// Purpose: Shows all jobs posted on the platform with status,
// applicant counts, and quick links to post new jobs or view
// the candidate pipeline filtered by job.
//
// ── Layout ───────────────────────────────────────────────────
//   AdminSidebar (left) + Main content:
//     - Stats row (Published / Draft / Total Applicants)
//     - Search bar
//     - Jobs grid (cards with key metadata + actions)
//
// ── States ───────────────────────────────────────────────────
//   1. loading     — spinner while fetching jobs
//   2. populated   — job cards displayed
//   3. empty       — no jobs at all → CTA to post first job
//   4. no_results  — search returned nothing
// ============================================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { fetchJobs } from '@/lib/db';
import { Job } from '@/lib/types';
import {
  Briefcase, PlusCircle, Search, Users, CheckCircle2,
  FileText, Clock, MapPin, Building2, Tag, ChevronRight,
  Loader, BarChart3, Eye, Layers, X, Zap,
} from 'lucide-react';

// ── Status badge ──
function StatusBadge({ status }: { status: string }) {
  const cfg =
    status === 'published'
      ? { label: 'Published', color: '#34D399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' }
      : status === 'draft'
      ? { label: 'Draft', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' }
      : { label: status, color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
      padding: '0.2rem 0.55rem', borderRadius: 20,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
}

// ── Job card ──
function JobCard({ job }: { job: Job }) {
  const [hovered, setHovered] = useState(false);

  const typeLabel: Record<string, string> = {
    'full-time': 'Full-time',
    'part-time': 'Part-time',
    contract: 'Contract',
    remote: 'Remote',
    hybrid: 'Hybrid',
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${hovered ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 16,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'all 0.2s',
        cursor: 'default',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,58,237,0.12)' : 'none',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.12) 100%)',
            border: '1px solid rgba(124,58,237,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Briefcase size={18} color="#A78BFA" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {job.title}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{job.company}</p>
          </div>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {job.location && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <MapPin size={11} /> {job.location}
          </span>
        )}
        {job.department && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Building2 size={11} /> {job.department}
          </span>
        )}
        {job.type && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Clock size={11} /> {typeLabel[job.type] || job.type}
          </span>
        )}
        {job.salary && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#A78BFA' }}>
            <Tag size={11} /> {job.salary}
          </span>
        )}
      </div>

      {/* Summary */}
      {job.summary && (
        <p style={{
          fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {job.summary}
        </p>
      )}

      {/* Must-have skills */}
      {job.mustHaveSkills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {job.mustHaveSkills.slice(0, 5).map((s, i) => (
            <span key={i} style={{
              fontSize: '0.68rem', fontWeight: 600, padding: '0.18rem 0.5rem', borderRadius: 20,
              background: 'rgba(124,58,237,0.1)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.2)',
            }}>{s}</span>
          ))}
          {job.mustHaveSkills.length > 5 && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0.18rem 0' }}>
              +{job.mustHaveSkills.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Footer: applicants + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Users size={13} color="#67E8F9" />
          <span style={{ fontSize: '0.8rem', color: '#67E8F9', fontWeight: 600 }}>
            {job.applicantCount} applicant{job.applicantCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href={`/jobs/${job.id}`}
            target="_blank"
            title="View public job listing"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.73rem', color: 'var(--text-muted)',
              padding: '0.3rem 0.6rem', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)',
              textDecoration: 'none', transition: 'all 0.15s',
            }}
          >
            <Eye size={12} /> View
          </Link>
          <Link
            href={`/admin/candidates?job=${encodeURIComponent(job.title)}`}
            title="See candidates for this job"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.73rem', color: '#A78BFA',
              padding: '0.3rem 0.7rem', borderRadius: 8,
              border: '1px solid rgba(124,58,237,0.25)',
              background: 'rgba(124,58,237,0.08)',
              textDecoration: 'none', transition: 'all 0.15s',
            }}
          >
            <Users size={12} /> Candidates
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    fetchJobs().then(data => {
      setJobs(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const matchSearch = !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.company.toLowerCase().includes(search.toLowerCase()) ||
        j.location?.toLowerCase().includes(search.toLowerCase()) ||
        j.department?.toLowerCase().includes(search.toLowerCase()) ||
        j.mustHaveSkills.some(s => s.toLowerCase().includes(search.toLowerCase()));
      const matchFilter = filter === 'all' || j.status === filter;
      return matchSearch && matchFilter;
    });
  }, [jobs, search, filter]);

  const stats = useMemo(() => ({
    total: jobs.length,
    published: jobs.filter(j => j.status === 'published').length,
    draft: jobs.filter(j => j.status === 'draft').length,
    totalApplicants: jobs.reduce((s, j) => s + (j.applicantCount || 0), 0),
  }), [jobs]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <AdminSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Page header */}
        <div style={{
          padding: '1.75rem 2rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(180deg, rgba(124,58,237,0.06) 0%, transparent 100%)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Layers size={22} color="#A78BFA" />
                Job Listings
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                All jobs posted on your recruitment portal
              </p>
            </div>
            <Link
              href="/admin/jobs/new"
              id="post-new-job-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                padding: '0.6rem 1.25rem', borderRadius: 10,
                textDecoration: 'none', boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                transition: 'all 0.2s',
              }}
            >
              <PlusCircle size={16} />
              Post New Job
            </Link>
          </div>

          {/* Stats row */}
          {!loading && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Jobs', value: stats.total, icon: <Briefcase size={15} />, color: '#A78BFA', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.2)' },
                { label: 'Published', value: stats.published, icon: <CheckCircle2 size={15} />, color: '#34D399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
                { label: 'Draft', value: stats.draft, icon: <FileText size={15} />, color: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
                { label: 'Total Applicants', value: stats.totalApplicants, icon: <Users size={15} />, color: '#67E8F9', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
              ].map(stat => (
                <div key={stat.label} style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.6rem 1rem', borderRadius: 10,
                  background: stat.bg, border: `1px solid ${stat.border}`,
                }}>
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                  <div>
                    <p style={{ fontSize: '1.05rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ padding: '1rem 2rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              id="jobs-search-input"
              type="text"
              placeholder="Search jobs by title, department, skill..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 36, paddingRight: search ? 32 : 12,
                paddingTop: '0.5rem', paddingBottom: '0.5rem',
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
                borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {(['all', 'published', 'draft'] as const).map(f => (
              <button
                key={f}
                id={`filter-${f}-btn`}
                onClick={() => setFilter(f)}
                style={{
                  fontSize: '0.78rem', fontWeight: filter === f ? 700 : 500,
                  padding: '0.4rem 0.85rem', borderRadius: 8, cursor: 'pointer',
                  background: filter === f ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                  color: filter === f ? '#A78BFA' : 'var(--text-muted)',
                  border: `1px solid ${filter === f ? 'rgba(124,58,237,0.3)' : 'var(--border-subtle)'}`,
                  transition: 'all 0.15s',
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '1.5rem 2rem 3rem' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: '1rem' }}>
              <Loader size={36} style={{ color: '#A78BFA', animation: 'admin-spin 1.2s linear infinite' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading job listings...</p>
            </div>
          ) : filtered.length === 0 && jobs.length === 0 ? (
            /* Empty state — no jobs at all */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: '1.25rem', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={32} color="#A78BFA" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>No Jobs Posted Yet</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 340 }}>
                  Start building your talent pipeline by posting your first job listing.
                </p>
              </div>
              <Link
                href="/admin/jobs/new"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                  color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                  padding: '0.65rem 1.5rem', borderRadius: 12,
                  textDecoration: 'none', boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                }}
              >
                <PlusCircle size={16} /> Post Your First Job
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            /* No search results */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: '1rem', textAlign: 'center' }}>
              <Search size={36} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.3rem' }}>No jobs match &ldquo;{search}&rdquo;</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Try a different keyword or clear the filter.</p>
              </div>
              <button
                onClick={() => { setSearch(''); setFilter('all'); }}
                style={{ fontSize: '0.8rem', color: '#A78BFA', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Showing {filtered.length} of {jobs.length} job{jobs.length !== 1 ? 's' : ''}
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '1rem',
              }}>
                {filtered.map(job => <JobCard key={job.id} job={job} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
