// ============================================================
// PAGE 3 — JOB DETAIL PAGE
// Route: /jobs/[id]
//
// Purpose: Shows one job's full description. Candidate reads
// the role and clicks "Apply with Video/Voice Intro" which
// leads them to the Consent page (Page 4).
//
// States handled:
//   1. loading    — handled by loading.tsx (Next.js Suspense)
//   2. loaded     — full job detail view
//   3. not found  — "This job is no longer available" screen
//
// This is a Server Component — no 'use client' needed.
// Data is read synchronously from mock-data (simulates DB read).
// In production: replace getJobById() with a DB/API call.
//
// Functions:
//   generateMetadata()   — dynamic <title> per job (SEO)
//   generateStaticParams() — pre-render all job ID routes
//   JobNotFound()        — friendly 404 sub-component
//   JobDetailPage()      — main page component
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getJobById, MOCK_JOBS } from '@/lib/mock-data';
import { fetchJobById } from '@/lib/db';
import { JobType } from '@/lib/types';
import {
  MapPin, Briefcase, Users, Clock, ArrowRight,
  CheckCircle2, Video, Mic, Brain, Zap,
  ChevronLeft, Building2, Calendar, IndianRupee,
  AlertTriangle, ArrowLeft
} from 'lucide-react';

// ── Dynamic SEO metadata per job ──
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const job = (await fetchJobById(id)) ?? getJobById(id);
  if (!job) return { title: 'Job Not Found — LuminaryHire' };
  return {
    title: `${job.title} at ${job.company} — LuminaryHire`,
    description: job.summary,
  };
}

// ── Pre-generate all known job pages at build time ──
export async function generateStaticParams() {
  return MOCK_JOBS.map(job => ({ id: job.id }));
}

// ── Type badge colours ──
const TYPE_STYLES: Record<JobType, { bg: string; text: string; border: string; label: string }> = {
  'full-time': { bg: 'rgba(124,58,237,0.12)', text: '#A78BFA', border: 'rgba(124,58,237,0.25)', label: 'Full-time' },
  'part-time': { bg: 'rgba(6,182,212,0.12)',  text: '#67E8F9', border: 'rgba(6,182,212,0.25)',  label: 'Part-time' },
  'contract':  { bg: 'rgba(245,158,11,0.12)', text: '#FCD34D', border: 'rgba(245,158,11,0.25)', label: 'Contract'  },
  'remote':    { bg: 'rgba(16,185,129,0.12)', text: '#34D399', border: 'rgba(16,185,129,0.25)', label: 'Remote'    },
  'hybrid':    { bg: 'rgba(99,102,241,0.12)', text: '#A5B4FC', border: 'rgba(99,102,241,0.25)', label: 'Hybrid'    },
};

// ─────────────────────────────────────────────
// JOB NOT FOUND — State 3
// Shown when no job matches the URL param.
// Never shows a raw 404; always friendly with a path back.
// ─────────────────────────────────────────────
function JobNotFound() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{
            width: 80, height: 80,
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.75rem',
          }}>
            <AlertTriangle size={32} color="#FCD34D" />
          </div>

          <span style={{
            display: 'inline-block',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#FCD34D',
            fontSize: '0.72rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '0.3rem 0.8rem', borderRadius: 20, marginBottom: '1.25rem',
          }}>
            Role Unavailable
          </span>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>
            This job is no longer available
          </h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem', fontSize: '0.95rem' }}>
            This role may have been filled, put on hold, or the link may have expired.
            Check out our other open positions — we post new roles every week.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/jobs" className="btn-primary" id="back-to-listings-btn">
              <ArrowLeft size={16} /> Browse Open Roles
            </Link>
            <Link href="/support" className="btn-secondary">
              Contact Support
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE — Job Detail (State 2: Loaded)
// ─────────────────────────────────────────────
export default async function JobDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = (await fetchJobById(id)) ?? getJobById(id);

  // ── State 3: Job not found ──
  // We render our own friendly page rather than calling notFound()
  // which would show a generic Next.js 404 screen.
  if (!job) return <JobNotFound />;

  const typeStyle = TYPE_STYLES[job.type];
  const daysAgo = Math.floor((Date.now() - new Date(job.postedAt).getTime()) / 86400000);
  const postedLabel = daysAgo === 0 ? 'Posted today' : daysAgo === 1 ? 'Posted yesterday' : `Posted ${daysAgo} days ago`;

  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>

        {/* ── HERO HEADER ── */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(124,58,237,0.08) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '2.5rem 0 2rem',
        }}>
          <div className="container-xl">

            {/* Breadcrumb */}
            <Link href="/jobs" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none',
              marginBottom: '1.5rem',
              transition: 'color 0.2s',
            }}>
              <ChevronLeft size={15} /> Back to all jobs
            </Link>

            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{
                padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.72rem',
                fontWeight: 700, letterSpacing: '0.03em',
                background: typeStyle.bg, color: typeStyle.text, border: `1px solid ${typeStyle.border}`,
              }}>
                {typeStyle.label}
              </span>
              <span style={{
                padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.72rem',
                fontWeight: 700, letterSpacing: '0.03em',
                background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.2)',
              }}>
                ✦ Now Hiring
              </span>
            </div>

            {/* Title + Company */}
            <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: '0.4rem' }}>
              {job.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem' }}>
              <Building2 size={16} />
              <span style={{ fontWeight: 600 }}>{job.company}</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span>{job.department}</span>
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
              {[
                { icon: MapPin,         value: job.location },
                { icon: Briefcase,      value: job.salary ?? 'Salary not listed' },
                { icon: Users,          value: `${job.applicantCount} applicants` },
                { icon: Calendar,       value: postedLabel },
              ].map(({ icon: Icon, value }) => (
                <span key={value} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Icon size={14} /> {value}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── BODY: 2-COLUMN LAYOUT ── */}
        <div className="container-xl" style={{ padding: '2.5rem 1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 320px',
            gap: '2rem',
            alignItems: 'flex-start',
          }}>

            {/* ── LEFT COLUMN: Job content ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* About the role */}
              <div className="glass-card-static" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 4, height: 20, background: 'linear-gradient(#7C3AED, #4F46E5)', borderRadius: 2, display: 'inline-block' }} />
                  About the Role
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                  {job.description}
                </p>
              </div>

              {/* Responsibilities */}
              <div className="glass-card-static" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 4, height: 20, background: 'linear-gradient(#4F46E5, #06B6D4)', borderRadius: 2, display: 'inline-block' }} />
                  Responsibilities
                </h2>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {job.responsibilities.map((item, i) => (
                    <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{
                        flexShrink: 0, marginTop: 3,
                        width: 18, height: 18,
                        background: 'rgba(124,58,237,0.15)',
                        border: '1px solid rgba(124,58,237,0.3)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <CheckCircle2 size={11} color="#A78BFA" />
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div className="glass-card-static" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 4, height: 20, background: 'linear-gradient(#06B6D4, #10B981)', borderRadius: 2, display: 'inline-block' }} />
                  Requirements
                </h2>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {job.requirements.map((item, i) => (
                    <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{
                        flexShrink: 0, marginTop: 3,
                        width: 18, height: 18,
                        background: 'rgba(6,182,212,0.12)',
                        border: '1px solid rgba(6,182,212,0.25)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <CheckCircle2 size={11} color="#67E8F9" />
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Must-Have Skills */}
              <div className="glass-card-static" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 4, height: 20, background: 'linear-gradient(#10B981, #F59E0B)', borderRadius: 2, display: 'inline-block' }} />
                  Must-Have Skills
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  Our AI will weight these skills most heavily when evaluating your intro.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {job.mustHaveSkills.map(skill => (
                    <span key={skill} style={{
                      padding: '0.4rem 0.85rem',
                      background: 'rgba(124,58,237,0.1)',
                      border: '1px solid rgba(124,58,237,0.25)',
                      borderRadius: 20,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#A78BFA',
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN: Apply sidebar ── */}
            <div style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Primary Apply Card */}
              <div className="glass-card-static" style={{
                padding: '1.75rem',
                background: 'linear-gradient(145deg, rgba(124,58,237,0.1), rgba(79,70,229,0.07))',
                border: '1px solid rgba(124,58,237,0.25)',
              }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Ready to apply?</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  No résumé needed. Record a 60–90 second intro and our AI will match it to this role.
                </p>

                <Link
                  href={`/apply/${job.id}/consent`}
                  className="btn-primary"
                  id={`apply-video-btn-${job.id}`}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem' }}
                >
                  <Video size={17} /> Apply with Video Intro
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.85rem 0' }}>
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>or</span>
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
                </div>

                <Link
                  href={`/apply/${job.id}/consent`}
                  className="btn-secondary"
                  id={`apply-voice-btn-${job.id}`}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.875rem' }}
                >
                  <Mic size={16} /> Voice-Only Intro
                </Link>

                <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Your consent is required before any recording starts.
                </p>
              </div>

              {/* What happens next */}
              <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.75rem' }}>
                  What happens next
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  {[
                    { icon: Video,  color: '#A78BFA', title: 'Record your intro', desc: 'Speak for 60–90 seconds about your experience and why you\'re a great fit.' },
                    { icon: Brain,  color: '#67E8F9', title: 'AI reviews it',     desc: 'Our AI transcribes and scores your intro against this role\'s requirements — fairly, within minutes.' },
                    { icon: Zap,    color: '#34D399', title: 'Get a response',    desc: 'You\'ll receive a decision by email — typically within 10 minutes of submission.' },
                  ].map(({ icon: Icon, color, title, desc }) => (
                    <div key={title} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{
                        flexShrink: 0, width: 32, height: 32, borderRadius: 8,
                        background: `${color}18`, border: `1px solid ${color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={15} color={color} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.83rem', fontWeight: 600, marginBottom: '0.15rem' }}>{title}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job summary card */}
              <div className="glass-card-static" style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.9rem' }}>
                  Job Summary
                </p>
                {[
                  { label: 'Location',   value: job.location },
                  { label: 'Work style', value: typeStyle.label },
                  { label: 'Department', value: job.department },
                  ...(job.salary ? [{ label: 'Compensation', value: job.salary }] : []),
                  { label: 'Applicants', value: `${job.applicantCount} so far` },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    fontSize: '0.82rem',
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* ── MOBILE STICKY APPLY BAR ── */}
        <div style={{
          display: 'none', // shown via CSS media query below
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: 'rgba(8,11,20,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '1rem 1.5rem',
          zIndex: 200,
        }} id="mobile-apply-bar">
          <Link
            href={`/apply/${job.id}/consent`}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
          >
            <Video size={17} /> Apply with Video / Voice Intro <ArrowRight size={16} />
          </Link>
        </div>

        <style>{`
          @media (max-width: 768px) {
            #mobile-apply-bar { display: block !important; }
            .container-xl > div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr !important;
            }
            /* hide sticky sidebar on mobile — apply bar handles it */
            .container-xl > div[style*="gridTemplateColumns"] > div:last-child {
              display: none;
            }
          }
        `}</style>

      </main>
      <Footer />
    </>
  );
}
