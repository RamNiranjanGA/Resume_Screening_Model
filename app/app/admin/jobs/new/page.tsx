// ============================================================
// PAGE 10 — POST A JOB
// Route: /admin/jobs/new
//
// Purpose: A recruiter-facing multi-section form that lets
// admins draft and publish new job listings on the platform.
// Submitted jobs appear immediately in /jobs for candidates.
//
// ── Layout ───────────────────────────────────────────────────
//   Left sidebar (AdminSidebar) + two-column main area:
//     Left main  — The actual form (scrollable)
//     Right main — Live preview panel (sticky)
//
// ── Form Sections (not multi-step — all visible, tab-grouped)
//   Section 1: Basic Info
//     - Job title*         (text, 5–120 chars)
//     - Company*           (text, pre-filled from recruiter)
//     - Department*        (select)
//     - Location*          (text, India city/state)
//     - Job type*          (select: full-time/part-time/contract/remote/hybrid)
//     - Salary (optional)  (text, free-form, e.g. "₹24–38 LPA")
//
//   Section 2: Role Details
//     - Summary*           (textarea, 80–300 chars, character counter)
//     - Description*       (textarea, 200–2000 chars, character counter)
//
//   Section 3: Requirements
//     - Responsibilities*  (tag-textarea: enter, add to list, min 2)
//     - Requirements*      (tag-textarea: enter, add to list, min 2)
//     - Must-have skills*  (tag-input: enter skills as chips, min 2)
//
//   Section 4: Preview & Publish
//     - Live rendered preview of how the job card will look
//     - Save as Draft button (status='draft')
//     - Publish button (status='published')
//
// ── All States ───────────────────────────────────────────────
//   1. idle              — form ready to fill
//   2. dirty             — user has started filling
//   3. validation_error  — missing/invalid fields on submit
//   4. saving_draft      — spinner, "Saving draft..."
//   5. publishing        — spinner, "Publishing job..."
//   6. saved_draft       — banner "Saved as draft successfully"
//   7. published         — success screen + confetti + redirect CTA
//   8. unsaved_changes   — browser confirm on navigate away
//
// ── Edge Cases ────────────────────────────────────────────────
//   - Empty title: "Job title is required"
//   - Title < 5 chars: "Title is too short"
//   - Summary > 300 chars: character counter turns red, submit blocked
//   - Description > 2000 chars: character counter turns red
//   - 0 responsibilities: "Add at least 2 responsibilities"
//   - 0 requirements: "Add at least 2 requirements"
//   - 0 must-have skills: "Add at least 2 must-have skills"
//   - Pressing Enter in skill input adds chip
//   - Duplicate skill silently ignored
//   - Empty skill chip (whitespace only) not added
//   - "×" button removes individual chips
//   - Form scrolls to first error field on invalid submit
//
// ── Demo / Mock ──────────────────────────────────────────────
//   "Fill with Sample Data" button populates all fields for demo
//
// Functions:
//   PostJobPage()       — main page component
//   SectionCard()       — collapsible form section wrapper
//   TagListInput()      — list of text items (responsibilities/requirements)
//   SkillTagInput()     — chip-style tag input for skills
//   CharCounter()       — character count display below textareas
//   PreviewJobCard()    — live read-only preview of the job
//   SuccessScreen()     — shown after successful publish
// ============================================================

'use client';

import { useState, useRef, FormEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/layout/AdminSidebar';
import {
  Briefcase, MapPin, Clock, DollarSign, FileText, Users,
  CheckSquare, Star, Save, Send, X, Plus, ArrowRight,
  AlertCircle, CheckCircle2, Loader, Info, Sparkles,
  Building2, ChevronDown, Eye, Zap, Copy, Check, ExternalLink
} from 'lucide-react';
import { JobType } from '@/lib/types';
import { createJob } from '@/lib/db';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type FormStatus =
  | 'idle'
  | 'dirty'
  | 'validation_error'
  | 'saving_draft'
  | 'publishing'
  | 'saved_draft'
  | 'published';

interface FormData {
  title: string;
  company: string;
  department: string;
  location: string;
  type: JobType | '';
  salary: string;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  mustHaveSkills: string[];
}

interface FormErrors {
  title?: string;
  company?: string;
  department?: string;
  location?: string;
  type?: string;
  summary?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  mustHaveSkills?: string;
}

const EMPTY_FORM: FormData = {
  title: '', company: 'Luminary Labs', department: '', location: '',
  type: '', salary: '', summary: '', description: '',
  responsibilities: [], requirements: [], mustHaveSkills: [],
};

const SAMPLE_DATA: FormData = {
  title: 'Senior Backend Engineer',
  company: 'Luminary Labs',
  department: 'Engineering',
  location: 'Bengaluru, Karnataka',
  type: 'hybrid',
  salary: '₹28 – 44 LPA',
  summary: 'Build the scalable APIs and data pipelines that power our AI hiring intelligence platform, serving thousands of candidates across India daily.',
  description: `We're looking for a Senior Backend Engineer to join our growing platform team in Bengaluru. You'll design and implement reliable, high-throughput APIs and microservices that sit at the heart of our AI-powered hiring intelligence product.

You'll work closely with AI engineers, frontend engineers, and product managers to build features that process thousands of video submissions per day. Security, scalability, and clean architecture are your north stars.`,
  responsibilities: [
    'Design and build RESTful and GraphQL APIs in Node.js/TypeScript',
    'Architect scalable microservices and event-driven data pipelines',
    'Own CI/CD pipelines and deployment automation on AWS',
    'Ensure system reliability and observability through monitoring and alerting',
    'Mentor junior engineers and lead backend architecture decisions',
  ],
  requirements: [
    '5+ years of backend engineering with Node.js and TypeScript',
    'Strong SQL and NoSQL database knowledge (PostgreSQL, Redis)',
    'Hands-on experience with AWS (Lambda, RDS, SQS, S3)',
    'Familiarity with message queues and async processing patterns',
    'Security-first mindset with knowledge of OWASP best practices',
  ],
  mustHaveSkills: ['Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Redis'],
};

const DEPARTMENTS = [
  'Engineering', 'Design', 'Product', 'AI Research', 'Marketing',
  'Sales', 'Customer Success', 'HR', 'Finance', 'Legal', 'Operations',
];

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

// ─────────────────────────────────────────────
// CHAR COUNTER
// ─────────────────────────────────────────────
function CharCounter({ current, max, min }: { current: number; max: number; min?: number }) {
  const near   = current >= max * 0.85;
  const over   = current > max;
  const under  = min !== undefined && current < min && current > 0;
  const color  = over ? 'var(--accent-red)' : near ? '#FBBF24' : 'var(--text-muted)';

  return (
    <span style={{ fontSize: '0.72rem', color, fontVariantNumeric: 'tabular-nums' }}>
      {current}/{max}{min && current > 0 && under ? ` (min ${min})` : ''}
    </span>
  );
}

// ─────────────────────────────────────────────
// SECTION CARD
// ─────────────────────────────────────────────
function SectionCard({
  id, title, icon, children, errorCount
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  errorCount?: number;
}) {
  return (
    <div
      id={id}
      className="glass-card-static"
      style={{ padding: '1.75rem', marginBottom: '1.25rem', scrollMarginTop: '1.5rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA', flexShrink: 0 }}>
          {icon}
        </div>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, flex: 1 }}>{title}</h2>
        {!!errorCount && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#FCA5A5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, padding: '0.2rem 0.6rem' }}>
            <AlertCircle size={12} />
            {errorCount} issue{errorCount > 1 ? 's' : ''}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// TAG LIST INPUT
// Multiline text items added one at a time
// ─────────────────────────────────────────────
function TagListInput({
  id, items, onChange, placeholder, error, maxItems = 10,
}: {
  id: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  error?: string;
  maxItems?: number;
}) {
  const [inputVal, setInputVal] = useState('');

  const addItem = () => {
    const trimmed = inputVal.trim();
    if (!trimmed || items.includes(trimmed) || items.length >= maxItems) return;
    onChange([...items, trimmed]);
    setInputVal('');
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem(); }
  };

  return (
    <div>
      {/* Existing items */}
      {items.length > 0 && (
        <ul style={{ listStyle: 'none', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {items.map((item, i) => (
            <li
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                padding: '0.55rem 0.75rem',
                background: 'rgba(124,58,237,0.06)',
                border: '1px solid rgba(124,58,237,0.12)',
                borderRadius: 8, fontSize: '0.88rem', color: 'var(--text-secondary)',
              }}
            >
              <span style={{ color: '#A78BFA', fontWeight: 700, fontSize: '0.8rem', marginTop: 1 }}>{i + 1}.</span>
              <span style={{ flex: 1, lineHeight: 1.5 }}>{item}</span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                aria-label={`Remove item ${i + 1}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center', marginTop: 1, flexShrink: 0 }}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add new item row */}
      {items.length < maxItems && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            id={id}
            type="text"
            className="form-input"
            style={{ flex: 1, borderColor: error && items.length === 0 ? 'var(--accent-red)' : undefined }}
            placeholder={placeholder}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            type="button"
            onClick={addItem}
            disabled={!inputVal.trim()}
            aria-label="Add item"
            style={{
              padding: '0 1rem', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: 'var(--radius-md)', color: '#A78BFA', cursor: inputVal.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600,
              fontFamily: 'inherit', opacity: inputVal.trim() ? 1 : 0.5, transition: 'all 0.2s', flexShrink: 0
            }}
          >
            <Plus size={15} /> Add
          </button>
        </div>
      )}
      {items.length >= maxItems && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Maximum {maxItems} items reached.</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SKILL TAG INPUT
// Chip-style tag input
// ─────────────────────────────────────────────
function SkillTagInput({
  id, tags, onChange, error,
}: {
  id: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  error?: string;
}) {
  const [inputVal, setInputVal] = useState('');

  const addTag = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    if (tags.map(t => t.toLowerCase()).includes(trimmed.toLowerCase())) { setInputVal(''); return; } // dup ignored
    onChange([...tags, trimmed]);
    setInputVal('');
  };

  const removeTag = (i: number) => onChange(tags.filter((_, idx) => idx !== i));

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !inputVal && tags.length > 0) removeTag(tags.length - 1);
  };

  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center',
        padding: '0.65rem', minHeight: 48,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${error && tags.length === 0 ? 'var(--accent-red)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-md)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        cursor: 'text',
      }}
      onClick={() => (document.getElementById(id) as HTMLInputElement)?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={i}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.2rem 0.55rem 0.2rem 0.7rem',
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem', fontWeight: 600, color: '#C4B5FD',
          }}
        >
          {tag}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); removeTag(i); }}
            aria-label={`Remove skill ${tag}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', display: 'flex', alignItems: 'center', padding: 0, lineHeight: 1 }}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={handleKey}
        onBlur={addTag}
        placeholder={tags.length === 0 ? 'Type a skill and press Enter…' : ''}
        style={{
          flex: 1, minWidth: 120, background: 'none', border: 'none', outline: 'none',
          color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', padding: '0.1rem 0.3rem',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// PREVIEW JOB CARD
// Renders a realistic preview of the job posting
// ─────────────────────────────────────────────
function PreviewJobCard({ data }: { data: FormData }) {
  const isEmpty = !data.title && !data.summary;

  const typeColors: Record<string, string> = {
    'full-time': 'badge-purple',
    'part-time': 'badge-blue',
    contract: 'badge-amber',
    remote: 'badge-cyan',
    hybrid: 'badge-green',
  };

  return (
    <div style={{ position: 'sticky', top: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Eye size={15} style={{ color: '#A78BFA' }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#A78BFA', letterSpacing: '0.04em' }}>
          CANDIDATE PREVIEW
        </span>
      </div>

      {isEmpty ? (
        <div className="glass-card-static" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#A78BFA' }}>
            <Eye size={20} />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Start filling out the form to see a live preview of your job listing.
          </p>
        </div>
      ) : (
        <div className="glass-card-static" style={{ padding: '1.5rem', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>
                {data.title || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Job title...</span>}
              </h3>
              {data.type && (
                <span className={`badge ${typeColors[data.type] ?? 'badge-purple'}`} style={{ flexShrink: 0, textTransform: 'capitalize' }}>
                  {data.type}
                </span>
              )}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {data.company && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Building2 size={11} /> {data.company}</span>}
              {data.department && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Briefcase size={11} /> {data.department}</span>}
              {data.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={11} /> {data.location}</span>}
              {data.salary && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><DollarSign size={11} /> {data.salary}</span>}
            </div>
          </div>

          {/* Separator */}
          <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: '0.85rem' }} />

          {/* Summary */}
          {data.summary && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.85rem' }}>
              {data.summary}
            </p>
          )}

          {/* Must-have skills */}
          {data.mustHaveSkills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1rem' }}>
              {data.mustHaveSkills.map((s, i) => (
                <span key={i} className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{s}</span>
              ))}
            </div>
          )}

          {/* Responsibilities preview */}
          {data.responsibilities.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                Responsibilities
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {data.responsibilities.slice(0, 3).map((r, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: '#A78BFA', marginTop: '0.15rem', flexShrink: 0 }}>•</span>
                    {r}
                  </li>
                ))}
                {data.responsibilities.length > 3 && (
                  <li style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+{data.responsibilities.length - 3} more…</li>
                )}
              </ul>
            </div>
          )}

          {/* Apply CTA preview */}
          <div style={{ marginTop: '1rem', padding: '0.65rem 1rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.07))', borderRadius: 10, border: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Candidates will see an &ldquo;Apply&rdquo; button here
            </span>
            <div style={{ padding: '0.35rem 0.85rem', background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
              Apply Now
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SUCCESS SCREEN
// ─────────────────────────────────────────────
function SuccessScreen({
  jobTitle,
  jobId,
  onViewAll,
}: {
  jobTitle: string;
  jobId?: string;
  onViewAll: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const publicUrl = jobId
    ? (typeof window !== 'undefined' ? `${window.location.origin}/jobs/${jobId}` : `/jobs/${jobId}`)
    : '';

  const handleCopy = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        {/* Big check */}
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 30px rgba(16,185,129,0.25)' }}>
          <CheckCircle2 size={40} color="#34D399" />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, marginBottom: '1rem' }}>
          <Zap size={13} style={{ color: '#34D399' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34D399', letterSpacing: '0.05em' }}>JOB PUBLISHED LIVE</span>
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          {`"${jobTitle}" is now live!`}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: 440, margin: '0 auto 1.5rem' }}>
          Your job listing is immediately accessible to candidates on LuminaryHire. Anyone with the link can view requirements and apply with their video intro.
        </p>

        {jobId && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Candidate Application URL
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                readOnly
                value={publicUrl}
                style={{
                  flex: 1,
                  minWidth: 220,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleCopy}
                className="btn-secondary"
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.78rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {copied ? <Check size={14} color="#34D399" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <Link
                href={`/jobs/${jobId}`}
                target="_blank"
                className="btn-secondary"
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.78rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ExternalLink size={14} /> View Role
              </Link>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onViewAll}
            className="btn-primary"
            style={{ padding: '0.85rem 1.75rem' }}
          >
            <Users size={16} />
            View Candidate Pipeline
            <ArrowRight size={16} />
          </button>
          <Link href="/admin/jobs/new" className="btn-secondary" style={{ padding: '0.85rem 1.75rem' }}>
            <Plus size={16} />
            Post Another Job
          </Link>
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
          <Info size={12} />
          AI screening begins automatically as soon as a candidate submits their recording.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FIELD ERROR INLINE
// ─────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem', fontSize: '0.78rem', color: '#FCA5A5' }}>
      <AlertCircle size={12} style={{ flexShrink: 0 }} />
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────
export default function PostJobPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [publishedJobId, setPublishedJobId] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);

  // ── Helpers ──
  const update = <K extends keyof FormData>(field: K, val: FormData[K]) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field as keyof FormErrors]) setErrors(e => ({ ...e, [field]: undefined }));
    if (status === 'idle') setStatus('dirty');
  };

  // ── Validate ──
  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!form.title.trim()) e.title = 'Job title is required.';
    else if (form.title.trim().length < 5) e.title = 'Title is too short (min 5 characters).';
    else if (form.title.trim().length > 120) e.title = 'Title is too long (max 120 characters).';

    if (!form.company.trim()) e.company = 'Company name is required.';
    if (!form.department) e.department = 'Please select a department.';
    if (!form.location.trim()) e.location = 'Location is required (e.g., Bengaluru, Karnataka).';
    if (!form.type) e.type = 'Please select a job type.';

    if (!form.summary.trim()) e.summary = 'A short summary is required.';
    else if (form.summary.trim().length < 80) e.summary = `Summary is too short (${form.summary.trim().length}/80 characters minimum).`;
    else if (form.summary.length > 300) e.summary = 'Summary must be 300 characters or fewer.';

    if (!form.description.trim()) e.description = 'Full description is required.';
    else if (form.description.trim().length < 200) e.description = `Description is too short (${form.description.trim().length}/200 minimum).`;
    else if (form.description.length > 2000) e.description = 'Description must be 2000 characters or fewer.';

    if (form.responsibilities.length < 2) e.responsibilities = 'Add at least 2 responsibilities.';
    if (form.requirements.length < 2) e.requirements = 'Add at least 2 requirements.';
    if (form.mustHaveSkills.length < 2) e.mustHaveSkills = 'Add at least 2 must-have skills.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Count errors per section for the section headers
  const basicInfoErrors = [errors.title, errors.company, errors.department, errors.location, errors.type].filter(Boolean).length;
  const roleDetailsErrors = [errors.summary, errors.description].filter(Boolean).length;
  const requirementsErrors = [errors.responsibilities, errors.requirements, errors.mustHaveSkills].filter(Boolean).length;

  // ── Save as draft ──
  const handleSaveDraft = async () => {
    setStatus('saving_draft');
    await createJob({
      title: form.title || 'Untitled Draft',
      company: form.company || 'Luminary Labs',
      department: form.department || 'General',
      location: form.location || 'Bengaluru, Karnataka',
      type: (form.type as JobType) || 'hybrid',
      salary: form.salary,
      summary: form.summary || '',
      description: form.description || '',
      responsibilities: form.responsibilities,
      requirements: form.requirements,
      mustHaveSkills: form.mustHaveSkills,
      status: 'draft',
    });
    setStatus('saved_draft');
    setDraftSavedAt(new Date().toLocaleTimeString());
    setTimeout(() => setStatus('dirty'), 3000);
  };

  // ── Publish ──
  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setStatus('validation_error');
      // Scroll to first error
      const firstError = document.querySelector('[data-error="true"]') as HTMLElement;
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Scroll to first errored section
      if (errors.title || errors.company || errors.department || errors.location || errors.type) {
        document.getElementById('section-basic')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (errors.summary || errors.description) {
        document.getElementById('section-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        document.getElementById('section-requirements')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    setStatus('publishing');
    const created = await createJob({
      title: form.title,
      company: form.company,
      department: form.department,
      location: form.location,
      type: form.type as JobType,
      salary: form.salary,
      summary: form.summary,
      description: form.description,
      responsibilities: form.responsibilities,
      requirements: form.requirements,
      mustHaveSkills: form.mustHaveSkills,
      status: 'published',
    });
    if (created?.id) {
      setPublishedJobId(created.id);
    }
    setStatus('published');
  };

  const totalErrors = Object.values(errors).filter(Boolean).length;
  const isSubmitting = status === 'saving_draft' || status === 'publishing';

  // ── PUBLISHED state — show full-screen success ──
  if (status === 'published') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <AdminSidebar />
        <SuccessScreen
          jobTitle={form.title}
          jobId={publishedJobId}
          onViewAll={() => router.push('/admin/candidates')}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <AdminSidebar />

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Page header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.01)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Link href="/admin/candidates" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Post a Job</span>
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Post a New Job
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Sample data fill */}
            <button
              type="button"
              onClick={() => { setForm(SAMPLE_DATA); setErrors({}); setStatus('dirty'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 'var(--radius-md)', color: '#C4B5FD', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Sparkles size={14} />
              Fill Sample Data
            </button>

            {/* Draft saved indicator */}
            {status === 'saved_draft' && draftSavedAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#34D399' }}>
                <CheckCircle2 size={13} />
                Draft saved at {draftSavedAt}
              </div>
            )}

            {/* Save Draft */}
            <button
              type="button"
              id="save-draft-btn"
              onClick={handleSaveDraft}
              disabled={isSubmitting || status === 'idle'}
              className="btn-secondary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
            >
              {status === 'saving_draft' ? (
                <><Loader size={15} style={{ animation: 'admin-spin 1s linear infinite' }} /> Saving...</>
              ) : (
                <><Save size={15} /> Save Draft</>
              )}
            </button>

            {/* Publish */}
            <button
              type="button"
              id="publish-job-btn"
              onClick={handlePublish}
              disabled={isSubmitting}
              className="btn-primary"
              style={{ padding: '0.6rem 1.5rem', fontSize: '0.88rem' }}
            >
              {status === 'publishing' ? (
                <><Loader size={15} style={{ animation: 'admin-spin 1s linear infinite' }} /> Publishing...</>
              ) : (
                <><Send size={15} /> Publish Job</>
              )}
            </button>
          </div>
        </div>

        {/* Validation error summary banner */}
        {status === 'validation_error' && totalErrors > 0 && (
          <div
            role="alert"
            aria-live="assertive"
            className="alert-error"
            style={{ margin: '1.25rem 2rem 0', alignItems: 'flex-start' }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                {totalErrors} issue{totalErrors > 1 ? 's' : ''} found — please fix them before publishing
              </p>
              <ul style={{ listStyle: 'disc', paddingLeft: '1rem', fontSize: '0.82rem', lineHeight: 1.7, opacity: 0.9 }}>
                {Object.values(errors).filter(Boolean).map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <form
          onSubmit={handlePublish}
          noValidate
          aria-label="Post a new job form"
          style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', padding: '1.5rem 2rem 3rem', alignItems: 'start', maxWidth: 1280 }}
        >
          {/* ── LEFT: Form sections ── */}
          <div>

            {/* SECTION 1: Basic Info */}
            <SectionCard id="section-basic" title="Basic Information" icon={<Briefcase size={17} />} errorCount={basicInfoErrors}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                {/* Job title */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="job-title" className="form-label">Job Title *</label>
                  <input
                    id="job-title"
                    ref={titleRef}
                    type="text"
                    className="form-input"
                    placeholder="e.g., Senior Frontend Engineer"
                    value={form.title}
                    onChange={e => update('title', e.target.value)}
                    aria-invalid={!!errors.title}
                    maxLength={120}
                    style={{ borderColor: errors.title ? 'var(--accent-red)' : undefined }}
                    data-error={!!errors.title}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                    <FieldError message={errors.title} />
                    <CharCounter current={form.title.length} max={120} min={5} />
                  </div>
                </div>

                {/* Company */}
                <div className="form-group">
                  <label htmlFor="job-company" className="form-label">Company *</label>
                  <input
                    id="job-company"
                    type="text"
                    className="form-input"
                    placeholder="Company name"
                    value={form.company}
                    onChange={e => update('company', e.target.value)}
                    aria-invalid={!!errors.company}
                    style={{ borderColor: errors.company ? 'var(--accent-red)' : undefined }}
                  />
                  <FieldError message={errors.company} />
                </div>

                {/* Department */}
                <div className="form-group">
                  <label htmlFor="job-department" className="form-label">Department *</label>
                  <select
                    id="job-department"
                    className="form-select"
                    value={form.department}
                    onChange={e => update('department', e.target.value)}
                    aria-invalid={!!errors.department}
                    style={{ borderColor: errors.department ? 'var(--accent-red)' : undefined }}
                  >
                    <option value="">Select department…</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <FieldError message={errors.department} />
                </div>

                {/* Location */}
                <div className="form-group">
                  <label htmlFor="job-location" className="form-label">Office Location *</label>
                  <input
                    id="job-location"
                    type="text"
                    className="form-input"
                    placeholder="e.g., Bengaluru, Karnataka"
                    value={form.location}
                    onChange={e => update('location', e.target.value)}
                    aria-invalid={!!errors.location}
                    style={{ borderColor: errors.location ? 'var(--accent-red)' : undefined }}
                  />
                  <FieldError message={errors.location} />
                </div>

                {/* Job type */}
                <div className="form-group">
                  <label htmlFor="job-type" className="form-label">Job Type *</label>
                  <select
                    id="job-type"
                    className="form-select"
                    value={form.type}
                    onChange={e => update('type', e.target.value as JobType)}
                    aria-invalid={!!errors.type}
                    style={{ borderColor: errors.type ? 'var(--accent-red)' : undefined }}
                  >
                    <option value="">Select type…</option>
                    {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <FieldError message={errors.type} />
                </div>

                {/* Salary (optional) */}
                <div className="form-group">
                  <label htmlFor="job-salary" className="form-label">
                    Salary Range <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none' }}>(optional)</span>
                  </label>
                  <input
                    id="job-salary"
                    type="text"
                    className="form-input"
                    placeholder="e.g., ₹24 – 38 LPA"
                    value={form.salary}
                    onChange={e => update('salary', e.target.value)}
                  />
                </div>
              </div>
            </SectionCard>

            {/* SECTION 2: Role Details */}
            <SectionCard id="section-details" title="Role Details" icon={<FileText size={17} />} errorCount={roleDetailsErrors}>

              {/* Summary */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <label htmlFor="job-summary" className="form-label" style={{ margin: 0 }}>One-line Summary *</label>
                  <CharCounter current={form.summary.length} max={300} min={80} />
                </div>
                <textarea
                  id="job-summary"
                  className="form-input"
                  placeholder="A compelling one-sentence description of the role for the job listings page…"
                  value={form.summary}
                  onChange={e => update('summary', e.target.value)}
                  rows={2}
                  maxLength={300}
                  aria-invalid={!!errors.summary}
                  style={{ resize: 'vertical', lineHeight: 1.6, borderColor: errors.summary ? 'var(--accent-red)' : undefined }}
                />
                <FieldError message={errors.summary} />
              </div>

              {/* Description */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <label htmlFor="job-description" className="form-label" style={{ margin: 0 }}>Full Job Description *</label>
                  <CharCounter current={form.description.length} max={2000} min={200} />
                </div>
                <textarea
                  id="job-description"
                  className="form-input"
                  placeholder="Detailed description of the role, team, and impact. Use paragraphs for readability…"
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  rows={8}
                  maxLength={2000}
                  aria-invalid={!!errors.description}
                  style={{ resize: 'vertical', lineHeight: 1.7, borderColor: errors.description ? 'var(--accent-red)' : undefined }}
                />
                <FieldError message={errors.description} />
              </div>
            </SectionCard>

            {/* SECTION 3: Requirements */}
            <SectionCard id="section-requirements" title="Requirements & Skills" icon={<CheckSquare size={17} />} errorCount={requirementsErrors}>

              {/* Responsibilities */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="resp-input" className="form-label">
                  Key Responsibilities * <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', fontSize: '0.78rem' }}>— min 2, max 10</span>
                </label>
                <TagListInput
                  id="resp-input"
                  items={form.responsibilities}
                  onChange={v => update('responsibilities', v)}
                  placeholder="e.g., Lead code reviews and mentor junior engineers"
                  error={errors.responsibilities}
                />
                <FieldError message={errors.responsibilities} />
              </div>

              {/* Requirements */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="req-input" className="form-label">
                  Experience Requirements * <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', fontSize: '0.78rem' }}>— min 2, max 10</span>
                </label>
                <TagListInput
                  id="req-input"
                  items={form.requirements}
                  onChange={v => update('requirements', v)}
                  placeholder="e.g., 5+ years of experience with React and TypeScript"
                  error={errors.requirements}
                />
                <FieldError message={errors.requirements} />
              </div>

              {/* Must-have skills */}
              <div className="form-group">
                <label htmlFor="skills-input" className="form-label">
                  Must-Have Skills * <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', fontSize: '0.78rem' }}>— press Enter or comma to add</span>
                </label>
                <SkillTagInput
                  id="skills-input"
                  tags={form.mustHaveSkills}
                  onChange={v => update('mustHaveSkills', v)}
                  error={errors.mustHaveSkills}
                />
                <div style={{ marginTop: '0.4rem' }}>
                  <FieldError message={errors.mustHaveSkills} />
                  {!errors.mustHaveSkills && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Skills are matched against candidate transcripts by the AI scoring engine.
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Bottom action row (duplicate of header — for long forms) */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSubmitting || status === 'idle'}
                className="btn-secondary"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                {status === 'saving_draft' ? (
                  <><Loader size={15} style={{ animation: 'admin-spin 1s linear infinite' }} /> Saving...</>
                ) : (
                  <><Save size={15} /> Save Draft</>
                )}
              </button>
              <button
                type="submit"
                id="publish-job-btn-bottom"
                disabled={isSubmitting}
                className="btn-primary"
                style={{ padding: '0.75rem 1.75rem' }}
              >
                {status === 'publishing' ? (
                  <><Loader size={15} style={{ animation: 'admin-spin 1s linear infinite' }} /> Publishing...</>
                ) : (
                  <><Send size={15} /> Publish Job <ArrowRight size={15} /></>
                )}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Live preview ── */}
          <div>
            <PreviewJobCard data={form} />
          </div>
        </form>
      </div>

      {/* Global spinner keyframe */}
      <style jsx global>{`
        @keyframes admin-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
