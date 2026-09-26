// ============================================================
// PAGE 14 — SUPPORT / FAQ
// Route: /support
//
// Purpose: Help centre for candidates and recruiters. Contains:
//   - Searchable FAQ accordion
//   - Contact form (mock submission)
//   - Quick help links
//   - Status indicators for system health
//
// ── Layout ───────────────────────────────────────────────────
//   Header + Hero Section + FAQ Accordion + Contact Form + Footer
//
// ── FAQ Categories ───────────────────────────────────────────
//   1. For Candidates (6 questions)
//   2. For Recruiters (4 questions)
//   3. Technical (4 questions)
//   4. Privacy & Security (3 questions)
//
// ── Contact Form ─────────────────────────────────────────────
//   - Name, Email, Category (dropdown), Message
//   - Validation: all required, valid email
//   - States: idle, submitting, success
//
// ── Edge Cases ───────────────────────────────────────────────
//   - Search filters FAQ in real time (case-insensitive)
//   - Empty search results show friendly message
//   - Contact form submission is simulated (setTimeout)
//   - Form resets after successful submission
//   - Accordion opens only one item at a time
// ============================================================

'use client';

import { useState, useMemo, FormEvent } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Search, ChevronDown, ChevronUp, HelpCircle, Send,
  User, Briefcase, Shield, Cpu, Mail, MessageSquare,
  CheckCircle2, Loader, ExternalLink, ArrowRight,
  AlertCircle, Headphones, FileText, Zap, Clock,
  X
} from 'lucide-react';

// ─────────────────────────────────────────────
// FAQ DATA
// ─────────────────────────────────────────────
interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  // ── For Candidates ──
  {
    category: 'For Candidates',
    question: 'How do I apply for a job on LuminaryHire?',
    answer: 'Browse our open positions at /jobs, select a role that matches your skills, and click "Apply Now". You\'ll be guided through a consent screen, then asked to record a 60-second video or voice introduction. No paper resume is needed — your recording IS your application.',
  },
  {
    category: 'For Candidates',
    question: 'What happens after I submit my video?',
    answer: 'Your submission enters our AI screening pipeline. The AI transcribes your recording, analyses it against the job requirements, and generates a match score. This typically takes 2–5 minutes. You\'ll receive a tracking link to check your application status in real time.',
  },
  {
    category: 'For Candidates',
    question: 'Can I re-record my video before submitting?',
    answer: 'Yes! On the recording page, you can preview your recording and choose to re-record as many times as you want before clicking "Submit". Once submitted, the recording cannot be changed.',
  },
  {
    category: 'For Candidates',
    question: 'How is my video evaluated by the AI?',
    answer: 'The AI transcribes your recording and evaluates it against the job\'s must-have skills, experience requirements, and responsibilities. It looks at skill alignment, communication clarity, relevant experience depth, and role-specific knowledge. The result is a score from 0–100 with detailed reasoning.',
  },
  {
    category: 'For Candidates',
    question: 'What if I disagree with the AI\'s decision?',
    answer: 'Every application is subject to recruiter review. Recruiters can override the AI\'s decision at any time. If you believe there was an error, you can contact us through the form below and we\'ll ensure a human reviews your application.',
  },
  {
    category: 'For Candidates',
    question: 'Can I apply to multiple jobs?',
    answer: 'Absolutely! You can apply to as many open positions as you like. Each application requires its own video recording tailored to that specific role.',
  },

  // ── For Recruiters ──
  {
    category: 'For Recruiters',
    question: 'How do I post a new job listing?',
    answer: 'Log in to the Recruiter Portal at /admin/login, navigate to Jobs → Post a New Job, and fill out the multi-section form. You can save drafts, preview how the listing will appear to candidates, and publish when ready. Published jobs appear immediately on the public listings page.',
  },
  {
    category: 'For Recruiters',
    question: 'Can I override the AI\'s hiring recommendation?',
    answer: 'Yes — recruiter override is a core feature. On any candidate\'s detail page, click "Override AI Decision" to change the recommendation. You\'ll need to provide a reason, and the override is recorded in a permanent audit trail for compliance.',
  },
  {
    category: 'For Recruiters',
    question: 'How accurate is the AI scoring?',
    answer: 'Our AI scoring engine achieves 87% alignment with human recruiter decisions in benchmarks. However, we always recommend human review for borderline cases (scores between 55–75). The AI flags these automatically as "Manual Review" candidates.',
  },
  {
    category: 'For Recruiters',
    question: 'Can I see the candidate\'s full transcript?',
    answer: 'Yes. Each candidate\'s detail page includes the complete AI-generated transcript of their recording, alongside the AI score, reasoning, and the original recording. The transcript is generated using state-of-the-art speech-to-text technology.',
  },

  // ── Technical ──
  {
    category: 'Technical',
    question: 'What browsers are supported?',
    answer: 'LuminaryHire works best on the latest versions of Chrome, Firefox, Safari, and Edge. The video recording feature requires a browser that supports the MediaRecorder API. We recommend Chrome or Firefox for the best experience.',
  },
  {
    category: 'Technical',
    question: 'What are the recording requirements?',
    answer: 'Recordings can be up to 60 seconds long. We support both video (with webcam) and audio-only recordings. Minimum requirements: a working microphone for audio, or a webcam + microphone for video. Recordings are processed in WebM format and converted server-side.',
  },
  {
    category: 'Technical',
    question: 'How long is my data retained?',
    answer: 'Application data, including recordings and transcripts, is retained for 12 months from the date of submission. After that, it is automatically purged from our systems in accordance with the DPDP Act. You can request early deletion through the form below.',
  },
  {
    category: 'Technical',
    question: 'Is there an API for integration?',
    answer: 'We offer a REST API for enterprise customers to integrate LuminaryHire into their existing ATS (Applicant Tracking Systems). Contact our sales team at enterprise@luminaryhire.com for API documentation and pricing.',
  },

  // ── Privacy & Security ──
  {
    category: 'Privacy & Security',
    question: 'How is my data protected?',
    answer: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are ISO 27001 certified and fully compliant with the Digital Personal Data Protection (DPDP) Act, 2023. Our infrastructure runs on AWS with SOC 2 Type II compliance.',
  },
  {
    category: 'Privacy & Security',
    question: 'Can I delete my data?',
    answer: 'Yes. Under the DPDP Act, you have the right to erasure. Submit a data deletion request through the contact form below or email privacy@luminaryhire.com. We will process your request within 30 days.',
  },
  {
    category: 'Privacy & Security',
    question: 'Does the AI have any bias?',
    answer: 'We actively test for and mitigate bias in our AI models. The scoring engine evaluates only job-relevant criteria: skills, experience, and communication. It does not consider age, gender, ethnicity, accent, or appearance. We publish annual bias audit reports on our blog.',
  },
];

const CATEGORIES = Array.from(new Set(FAQ_DATA.map(f => f.category)));

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'For Candidates': <User size={16} />,
  'For Recruiters': <Briefcase size={16} />,
  'Technical': <Cpu size={16} />,
  'Privacy & Security': <Shield size={16} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  'For Candidates': '#818CF8',
  'For Recruiters': '#34D399',
  'Technical': '#F59E0B',
  'Privacy & Security': '#06B6D4',
};

// ─────────────────────────────────────────────
// CONTACT FORM TYPES
// ─────────────────────────────────────────────
type ContactStatus = 'idle' | 'submitting' | 'success';

const CONTACT_CATEGORIES = [
  'Application Issue',
  'Technical Problem',
  'Account / Login Help',
  'Data Deletion Request',
  'Recruiter Inquiry',
  'Bug Report',
  'Other',
];

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function SupportPage() {
  // FAQ state
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCategory, setContactCategory] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<ContactStatus>('idle');
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});

  // ── Filter FAQ ──
  const filteredFAQ = useMemo(() => {
    let items = FAQ_DATA;

    if (activeCategory) {
      items = items.filter(f => f.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(f =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
      );
    }

    return items;
  }, [searchQuery, activeCategory]);

  // ── Toggle FAQ ──
  const toggleFAQ = (idx: number) => {
    setOpenFAQ(openFAQ === idx ? null : idx);
  };

  // ── Contact form validation ──
  const validateContact = () => {
    const errs: Record<string, string> = {};
    if (!contactName.trim()) errs.name = 'Name is required.';
    if (!contactEmail.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) errs.email = 'Enter a valid email.';
    if (!contactCategory) errs.category = 'Please select a category.';
    if (!contactMessage.trim()) errs.message = 'Message is required.';
    else if (contactMessage.trim().length < 20) errs.message = 'Message must be at least 20 characters.';
    setContactErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Contact form submit ──
  const handleContactSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateContact()) return;
    setContactStatus('submitting');
    setTimeout(() => {
      setContactStatus('success');
      setContactName('');
      setContactEmail('');
      setContactCategory('');
      setContactMessage('');
      setContactErrors({});
      setTimeout(() => setContactStatus('idle'), 5000);
    }, 1200);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveCategory(null);
  };

  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>

        {/* ═══ HERO SECTION ═══ */}
        <section style={{ position: 'relative', padding: '4rem 1.5rem 3rem', textAlign: 'center', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(124,58,237,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, marginBottom: '1.25rem' }}>
              <Headphones size={13} style={{ color: '#A78BFA' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#A78BFA', letterSpacing: '0.05em' }}>HELP CENTRE</span>
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
              How can we help?
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Find answers to common questions or reach out to our team directly.
            </p>

            {/* Search bar */}
            <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                id="faq-search"
                type="text"
                className="form-input"
                placeholder="Search FAQs…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 44, fontSize: '0.95rem', height: 48 }}
                aria-label="Search frequently asked questions"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ═══ CATEGORY FILTER PILLS ═══ */}
        <section className="container-xl" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => setActiveCategory(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.45rem 1rem',
                background: !activeCategory ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${!activeCategory ? 'rgba(124,58,237,0.3)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-full)',
                color: !activeCategory ? '#C4B5FD' : 'var(--text-muted)',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
            >
              All Topics ({FAQ_DATA.length})
            </button>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat;
              const count = FAQ_DATA.filter(f => f.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(isActive ? null : cat)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.45rem 1rem',
                    background: isActive ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? 'rgba(124,58,237,0.3)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-full)',
                    color: isActive ? CATEGORY_COLORS[cat] : 'var(--text-muted)',
                    fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                >
                  {CATEGORY_ICONS[cat]}
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══ FAQ ACCORDION ═══ */}
        <section className="container-lg" style={{ marginBottom: '4rem' }}>
          {filteredFAQ.length === 0 ? (
            <div className="glass-card-static" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <HelpCircle size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>No matching questions found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                Try a different search term or browse all categories.
              </p>
              <button onClick={clearSearch} className="btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
                <X size={14} /> Clear Search
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filteredFAQ.map((faq, idx) => {
                const isOpen = openFAQ === idx;
                const catColor = CATEGORY_COLORS[faq.category] || '#A78BFA';
                return (
                  <div key={`${faq.category}-${idx}`} className="glass-card-static" style={{ overflow: 'hidden' }}>
                    <button
                      onClick={() => toggleFAQ(idx)}
                      aria-expanded={isOpen}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
                        width: '100%', padding: '1.15rem 1.5rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        textAlign: 'left', fontFamily: 'inherit',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: `${catColor}15`, border: `1px solid ${catColor}30`,
                        color: catColor, marginTop: 1,
                      }}>
                        {CATEGORY_ICONS[faq.category] || <HelpCircle size={14} />}
                      </span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: catColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {faq.category}
                        </span>
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4, marginTop: '0.15rem' }}>
                          {faq.question}
                        </p>
                      </div>
                      <span style={{ color: 'var(--text-muted)', marginTop: 3, flexShrink: 0 }}>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>

                    {isOpen && (
                      <div style={{
                        padding: '0 1.5rem 1.25rem 4.35rem',
                        fontSize: '0.9rem', color: 'var(--text-secondary)',
                        lineHeight: 1.8,
                      }}>
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ CONTACT FORM SECTION ═══ */}
        <section style={{ padding: '4rem 1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
          <div className="container-lg">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>

              {/* Left — info */}
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, marginBottom: '1.25rem' }}>
                  <MessageSquare size={13} style={{ color: '#34D399' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34D399', letterSpacing: '0.05em' }}>CONTACT US</span>
                </div>

                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                  Still need help?
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                  Can&apos;t find what you&apos;re looking for in the FAQ? Send us a message and our team will respond within 24 hours.
                </p>

                {/* Quick info cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { icon: <Mail size={16} />, label: 'Email', value: 'support@luminaryhire.com', color: '#818CF8' },
                    { icon: <Clock size={16} />, label: 'Response Time', value: 'Within 24 hours (business days)', color: '#34D399' },
                    { icon: <Shield size={16} />, label: 'Privacy', value: 'Your data is protected under DPDP Act', color: '#06B6D4' },
                  ].map(({ icon, label, value, color }, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                        {icon}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — form */}
              <div className="glass-card-static" style={{ padding: '1.75rem' }}>
                {contactStatus === 'success' ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <CheckCircle2 size={28} style={{ color: '#34D399' }} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Message Sent!</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                      We&apos;ve received your message and will respond within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} noValidate>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label htmlFor="contact-name" className="form-label">Name *</label>
                        <input id="contact-name" type="text" className="form-input" placeholder="Your name" value={contactName} onChange={e => { setContactName(e.target.value); if (contactErrors.name) setContactErrors(p => ({ ...p, name: '' })); }} aria-invalid={!!contactErrors.name} style={{ borderColor: contactErrors.name ? 'var(--accent-red)' : undefined }} />
                        {contactErrors.name && <p style={{ fontSize: '0.75rem', color: '#FCA5A5', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={11} /> {contactErrors.name}</p>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="contact-email" className="form-label">Email *</label>
                        <input id="contact-email" type="email" className="form-input" placeholder="you@example.com" value={contactEmail} onChange={e => { setContactEmail(e.target.value); if (contactErrors.email) setContactErrors(p => ({ ...p, email: '' })); }} aria-invalid={!!contactErrors.email} style={{ borderColor: contactErrors.email ? 'var(--accent-red)' : undefined }} />
                        {contactErrors.email && <p style={{ fontSize: '0.75rem', color: '#FCA5A5', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={11} /> {contactErrors.email}</p>}
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label htmlFor="contact-category" className="form-label">Category *</label>
                      <select id="contact-category" className="form-select" value={contactCategory} onChange={e => { setContactCategory(e.target.value); if (contactErrors.category) setContactErrors(p => ({ ...p, category: '' })); }} aria-invalid={!!contactErrors.category} style={{ borderColor: contactErrors.category ? 'var(--accent-red)' : undefined }}>
                        <option value="">Select a category…</option>
                        {CONTACT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {contactErrors.category && <p style={{ fontSize: '0.75rem', color: '#FCA5A5', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={11} /> {contactErrors.category}</p>}
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                        <label htmlFor="contact-message" className="form-label" style={{ margin: 0 }}>Message *</label>
                        <span style={{ fontSize: '0.72rem', color: contactMessage.length >= 20 ? 'var(--text-muted)' : '#FBBF24' }}>{contactMessage.length} / 2000</span>
                      </div>
                      <textarea id="contact-message" className="form-input" placeholder="Describe your issue or question in detail…" value={contactMessage} onChange={e => { setContactMessage(e.target.value); if (contactErrors.message) setContactErrors(p => ({ ...p, message: '' })); }} rows={5} maxLength={2000} aria-invalid={!!contactErrors.message} style={{ resize: 'vertical', lineHeight: 1.6, borderColor: contactErrors.message ? 'var(--accent-red)' : undefined }} />
                      {contactErrors.message && <p style={{ fontSize: '0.75rem', color: '#FCA5A5', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={11} /> {contactErrors.message}</p>}
                    </div>

                    <button type="submit" disabled={contactStatus === 'submitting'} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
                      {contactStatus === 'submitting' ? (
                        <><Loader size={16} style={{ animation: 'admin-spin 1s linear infinite' }} /> Sending...</>
                      ) : (
                        <><Send size={16} /> Send Message</>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <style jsx global>{`
        @keyframes admin-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          section [style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
