// ============================================================
// PAGE 15 — PRIVACY POLICY
// Route: /privacy
//
// Purpose: Legal privacy policy page for the platform.
// Covers data collection, usage, retention, rights, and
// compliance with the DPDP Act, 2023.
//
// ── Layout ───────────────────────────────────────────────────
//   Header + Policy content (sidebar TOC + main text) + Footer
//
// ── Sections ─────────────────────────────────────────────────
//   1. Introduction
//   2. Data We Collect
//   3. How We Use Your Data
//   4. AI Processing & Automated Decisions
//   5. Data Sharing & Third Parties
//   6. Data Retention
//   7. Your Rights Under DPDP Act
//   8. Cookies & Tracking
//   9. Security Measures
//  10. Changes to This Policy
//  11. Contact Us
//
// ── Features ─────────────────────────────────────────────────
//   - Sticky sidebar table of contents
//   - Smooth scroll to sections
//   - "Last updated" date
//   - Highlight active section in TOC while scrolling
//   - Print-friendly styling
// ============================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Shield, FileText, Database, Brain, Users, Clock,
  Scale, Cookie, Lock, Bell, Mail, ChevronRight,
  ExternalLink, Printer, ArrowUp
} from 'lucide-react';

// ─────────────────────────────────────────────
// POLICY SECTIONS
// ─────────────────────────────────────────────
interface PolicySection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const EFFECTIVE_DATE = '1 September 2026';
const LAST_UPDATED = '15 September 2026';

function SectionHeading({ id, title, icon }: { id: string; title: string; icon: React.ReactNode }) {
  return (
    <h2 id={id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', scrollMarginTop: '5rem', letterSpacing: '-0.01em' }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', color: '#A78BFA', flexShrink: 0 }}>
        {icon}
      </span>
      {title}
    </h2>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.85, marginBottom: '1rem' }}>{children}</p>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', paddingLeft: '0.5rem' }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <span style={{ color: '#A78BFA', marginTop: '0.35rem', flexShrink: 0 }}>•</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────
// SECTION DATA
// ─────────────────────────────────────────────
const SECTIONS: PolicySection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    icon: <FileText size={15} />,
    content: (
      <>
        <Paragraph>
          LuminaryHire (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the LuminaryHire platform — an AI-powered video resume screening service that connects job candidates with employers in India. This Privacy Policy explains how we collect, use, store, and protect your personal data.
        </Paragraph>
        <Paragraph>
          This policy applies to all users of our platform, including job candidates who submit video/audio applications, recruiters who manage job listings and review candidates, and visitors who browse our website. By using LuminaryHire, you agree to the data practices described in this policy.
        </Paragraph>
        <Paragraph>
          We are committed to compliance with the <strong style={{ color: 'var(--text-primary)' }}>Digital Personal Data Protection (DPDP) Act, 2023</strong> and all applicable data protection regulations in India.
        </Paragraph>
      </>
    ),
  },
  {
    id: 'data-collection',
    title: 'Data We Collect',
    icon: <Database size={15} />,
    content: (
      <>
        <Paragraph>We collect the following categories of personal data:</Paragraph>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>From Candidates:</h3>
          <BulletList items={[
            'Full name and email address (provided during application)',
            'Video and/or audio recordings (submitted as part of the application)',
            'AI-generated transcripts of your recordings',
            'AI match scores and reasoning analysis',
            'Application metadata (timestamps, job applied for, tracking tokens)',
            'Browser and device information (user agent, screen resolution — for compatibility)',
          ]} />
        </div>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>From Recruiters:</h3>
          <BulletList items={[
            'Company email address and login credentials (hashed)',
            'Job listings created (title, description, requirements, skills)',
            'Override decisions and audit trail data',
            'Session and activity logs within the recruiter portal',
          ]} />
        </div>
      </>
    ),
  },
  {
    id: 'data-usage',
    title: 'How We Use Your Data',
    icon: <Brain size={15} />,
    content: (
      <>
        <Paragraph>Your data is used for the following purposes:</Paragraph>
        <BulletList items={[
          'Processing and scoring your video/audio application against job requirements',
          'Generating text transcripts from your recordings using AI speech-to-text',
          'Providing recruiters with candidate match scores, transcripts, and recommendations',
          'Enabling recruiters to review, override, and manage candidate decisions',
          'Sending you application status updates and result notifications',
          'Improving our AI scoring accuracy through aggregated, anonymised analysis',
          'Maintaining platform security and preventing abuse',
          'Complying with legal obligations under applicable Indian law',
        ]} />
        <Paragraph>
          We do <strong style={{ color: 'var(--text-primary)' }}>not</strong> sell your personal data to third parties. We do not use your data for purposes unrelated to the hiring process without your explicit consent.
        </Paragraph>
      </>
    ),
  },
  {
    id: 'ai-processing',
    title: 'AI Processing & Automated Decisions',
    icon: <Brain size={15} />,
    content: (
      <>
        <Paragraph>
          LuminaryHire uses artificial intelligence to process candidate applications. The AI performs the following automated functions:
        </Paragraph>
        <BulletList items={[
          'Speech-to-text transcription of video/audio recordings',
          'Semantic analysis of transcript content against job requirements',
          'Skill matching: comparing mentioned skills against must-have skills for the role',
          'Scoring: generating a numerical match score (0–100) with detailed reasoning',
          'Decision recommendation: suggesting Selected, Not Selected, or Manual Review',
        ]} />
        <Paragraph>
          <strong style={{ color: 'var(--text-primary)' }}>Important:</strong> AI decisions are <em>recommendations only</em>. Every candidate application is subject to human recruiter review. Recruiters can override any AI decision at any time, and all overrides are recorded in an audit trail.
        </Paragraph>
        <Paragraph>
          Our AI does <strong style={{ color: 'var(--text-primary)' }}>not</strong> evaluate or consider: age, gender, ethnicity, race, religion, caste, disability status, accent, physical appearance, or any other protected characteristic. We conduct regular bias audits and publish the results annually.
        </Paragraph>
      </>
    ),
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing & Third Parties',
    icon: <Users size={15} />,
    content: (
      <>
        <Paragraph>Your data may be shared with:</Paragraph>
        <BulletList items={[
          'Recruiters: Candidates\' recordings, transcripts, and AI scores are shared with the recruiters managing the job listing the candidate applied to.',
          'Cloud infrastructure providers: AWS (hosting, storage), operated under strict data processing agreements.',
          'AI service providers: For transcription and scoring — processing only, no data retention by these providers.',
          'Legal authorities: If required by Indian law, court order, or regulatory request.',
        ]} />
        <Paragraph>
          We do not share your data with advertisers, data brokers, or any party that does not have a direct role in the hiring process.
        </Paragraph>
      </>
    ),
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    icon: <Clock size={15} />,
    content: (
      <>
        <Paragraph>We retain your personal data for the following periods:</Paragraph>
        <BulletList items={[
          'Candidate applications (including recordings and transcripts): 12 months from the date of submission',
          'Recruiter account data: duration of the account plus 6 months after deletion',
          'Audit trail data (override records): 24 months for compliance purposes',
          'Aggregated, anonymised analytics data: retained indefinitely',
        ]} />
        <Paragraph>
          After the retention period, your data is automatically and permanently deleted from our systems. You may request early deletion at any time (see &ldquo;Your Rights&rdquo; below).
        </Paragraph>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your Rights Under DPDP Act',
    icon: <Scale size={15} />,
    content: (
      <>
        <Paragraph>
          Under the Digital Personal Data Protection (DPDP) Act, 2023, you have the following rights:
        </Paragraph>
        <BulletList items={[
          'Right to Access: Request a copy of the personal data we hold about you.',
          'Right to Correction: Request correction of inaccurate or incomplete personal data.',
          'Right to Erasure: Request deletion of your personal data from our systems.',
          'Right to Grievance Redressal: Lodge a complaint with our Data Protection Officer or the Data Protection Board of India.',
          'Right to Nominate: Nominate another individual to exercise your rights in the event you are unable to do so.',
          'Right to Information: Be informed about what data is collected and how it is processed.',
        ]} />
        <Paragraph>
          To exercise any of these rights, contact us at <strong style={{ color: '#A78BFA' }}>privacy@luminaryhire.com</strong> or submit a request through our <Link href="/support" style={{ color: '#A78BFA', textDecoration: 'underline' }}>Support page</Link>. We will respond within 30 days.
        </Paragraph>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies & Tracking',
    icon: <Cookie size={15} />,
    content: (
      <>
        <Paragraph>LuminaryHire uses the following types of cookies:</Paragraph>
        <BulletList items={[
          'Essential cookies: Required for the platform to function (authentication tokens, session management).',
          'Analytics cookies: Anonymised usage data to improve the platform experience (no personally identifiable information).',
          'Preference cookies: Remembering your settings (e.g., dark mode preference, language).',
        ]} />
        <Paragraph>
          We do <strong style={{ color: 'var(--text-primary)' }}>not</strong> use advertising or cross-site tracking cookies. You can manage cookie preferences in your browser settings.
        </Paragraph>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security Measures',
    icon: <Lock size={15} />,
    content: (
      <>
        <Paragraph>We implement industry-standard security measures to protect your data:</Paragraph>
        <BulletList items={[
          'Encryption at rest: AES-256 encryption for all stored data',
          'Encryption in transit: TLS 1.3 for all data transmitted between your device and our servers',
          'Access control: Role-based access control (RBAC) with audit logging',
          'Authentication: Bcrypt password hashing, rate limiting, account lockout after failed attempts',
          'Infrastructure: AWS with SOC 2 Type II compliance, multi-AZ deployment',
          'Certifications: ISO 27001 certified',
          'Monitoring: 24/7 security monitoring and incident response',
        ]} />
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    icon: <Bell size={15} />,
    content: (
      <>
        <Paragraph>
          We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we make material changes, we will:
        </Paragraph>
        <BulletList items={[
          'Update the "Last Updated" date at the top of this page',
          'Notify registered users by email for significant changes',
          'Post a prominent notice on our platform for 30 days',
        ]} />
        <Paragraph>
          We encourage you to review this policy periodically. Continued use of LuminaryHire after changes constitutes acceptance of the updated policy.
        </Paragraph>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Us',
    icon: <Mail size={15} />,
    content: (
      <>
        <Paragraph>
          If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
        </Paragraph>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
          {[
            { label: 'Data Protection Officer', value: 'privacy@luminaryhire.com' },
            { label: 'General Support', value: 'support@luminaryhire.com' },
            { label: 'Registered Office', value: 'Luminary Labs Pvt. Ltd., Bengaluru, Karnataka, India' },
          ].map(({ label, value }, i) => (
            <div key={i} style={{ padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>{label}</p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{value}</p>
            </div>
          ))}
        </div>
        <Paragraph>
          You may also file a complaint with the <strong style={{ color: 'var(--text-primary)' }}>Data Protection Board of India</strong> if you believe your data rights have been violated.
        </Paragraph>
      </>
    ),
  },
];

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // ── Scroll spy ──
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      const scrollPos = window.scrollY + 120;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>

        {/* ═══ HERO ═══ */}
        <section style={{ position: 'relative', padding: '3.5rem 1.5rem 2.5rem', textAlign: 'center', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 350, background: 'radial-gradient(ellipse, rgba(6,182,212,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 20, marginBottom: '1.25rem' }}>
              <Shield size={13} style={{ color: '#67E8F9' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#67E8F9', letterSpacing: '0.05em' }}>LEGAL</span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
              Privacy Policy
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Effective: {EFFECTIVE_DATE} · Last updated: {LAST_UPDATED}
            </p>
          </div>
        </section>

        {/* ═══ CONTENT ═══ */}
        <section className="container-xl" style={{ padding: '0 1.5rem 4rem', display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2.5rem', alignItems: 'start' }}>

          {/* ── Sidebar TOC ── */}
          <nav
            aria-label="Table of contents"
            style={{ position: 'sticky', top: '5rem' }}
          >
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem', paddingLeft: '0.75rem' }}>
              On This Page
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {SECTIONS.map(s => {
                const isActive = activeSection === s.id;
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 8,
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#C4B5FD' : 'var(--text-muted)',
                      background: isActive ? 'rgba(124,58,237,0.08)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      borderLeft: isActive ? '2px solid #A78BFA' : '2px solid transparent',
                    }}
                  >
                    {s.title}
                  </a>
                );
              })}
            </div>

            {/* Print button */}
            <button
              onClick={() => window.print()}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                marginTop: '1.5rem', padding: '0.5rem 0.75rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', width: '100%',
              }}
            >
              <Printer size={13} /> Print this policy
            </button>
          </nav>

          {/* ── Main content ── */}
          <div>
            {SECTIONS.map((s, i) => (
              <div key={s.id} style={{ marginBottom: i < SECTIONS.length - 1 ? '2.5rem' : 0, paddingBottom: i < SECTIONS.length - 1 ? '2.5rem' : 0, borderBottom: i < SECTIONS.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <SectionHeading id={s.id} title={`${i + 1}. ${s.title}`} icon={s.icon} />
                {s.content}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />

      {/* Back to top FAB */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          style={{
            position: 'fixed', bottom: 32, right: 32,
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-violet))',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
            zIndex: 50,
            transition: 'all 0.3s',
          }}
        >
          <ArrowUp size={18} />
        </button>
      )}
    </>
  );
}
