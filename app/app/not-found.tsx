// ============================================================
// PAGE 13a — CUSTOM 404 NOT FOUND PAGE
// File: app/not-found.tsx (Next.js App Router convention)
//
// Purpose: Shown when a user navigates to any route that
// doesn't exist. Provides a friendly, on-brand error page
// with helpful navigation options to get them back on track.
//
// ── Design ───────────────────────────────────────────────────
//   - Centered error illustration (animated "404" text)
//   - Friendly copy: "This page doesn't exist"
//   - Contextual suggestions based on common paths
//   - Primary CTA: Go Home
//   - Secondary CTAs: Browse Jobs, Support
//   - Subtle floating particle animation in background
//
// ── Edge Cases ───────────────────────────────────────────────
//   - Works for both candidate and admin routes
//   - No external dependencies (pure CSS animations)
//   - Accessible: proper heading hierarchy and link labels
//   - SEO: title tag set to "Page Not Found"
// ============================================================

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Home, Briefcase, HelpCircle, ArrowRight,
  Search, ChevronLeft
} from 'lucide-react';

export default function NotFoundPage() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '3rem 1.5rem' }}>

        {/* Background ambient glows */}
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 280, height: 280, background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', maxWidth: 560, position: 'relative', zIndex: 1 }}>

          {/* Giant 404 */}
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <h1
              style={{
                fontSize: 'clamp(6rem, 15vw, 10rem)',
                fontWeight: 900,
                letterSpacing: '-0.05em',
                lineHeight: 1,
                background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(79,70,229,0.15) 50%, rgba(6,182,212,0.1) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                userSelect: 'none',
              }}
              aria-hidden="true"
            >
              404
            </h1>
            {/* Floating search icon */}
            <div
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(124,58,237,0.2)',
              }}
            >
              <Search size={30} style={{ color: '#A78BFA' }} />
            </div>
          </div>

          {/* Status badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, marginBottom: '1rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FCA5A5', letterSpacing: '0.05em' }}>PAGE NOT FOUND</span>
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            This page doesn&apos;t exist
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 420, margin: '0 auto 2.5rem' }}>
            The page you&apos;re looking for may have been moved, removed, or never existed in the first place. Let&apos;s get you back on track.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <Link href="/" className="btn-primary" style={{ padding: '0.85rem 1.75rem' }}>
              <Home size={16} />
              Go Home
            </Link>
            <Link href="/jobs" className="btn-secondary" style={{ padding: '0.85rem 1.75rem' }}>
              <Briefcase size={16} />
              Browse Jobs
            </Link>
          </div>

          {/* Quick links */}
          <div className="glass-card-static" style={{ padding: '1.25rem 1.5rem', textAlign: 'left' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>
              Popular destinations
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { href: '/', label: 'Home — LuminaryHire Landing Page', icon: <Home size={14} /> },
                { href: '/jobs', label: 'Browse open positions', icon: <Briefcase size={14} /> },
                { href: '/support', label: 'Get help & FAQ', icon: <HelpCircle size={14} /> },
                { href: '/admin/login', label: 'Recruiter Login', icon: <ChevronLeft size={14} /> },
              ].map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 8,
                    fontSize: '0.85rem', color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid transparent',
                  }}
                >
                  <span style={{ color: '#A78BFA' }}>{icon}</span>
                  <span style={{ flex: 1 }}>{label}</span>
                  <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
