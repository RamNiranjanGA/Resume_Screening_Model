'use client';

import Link from 'next/link';
import { Zap, X, Globe, Link2 } from 'lucide-react';

// ============================================================
// FOOTER — Appears on all public pages
// Contains: logo, brief tagline, nav links, legal links, social
// ============================================================

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-secondary)',
      padding: '3.5rem 0 2rem',
      marginTop: 'auto',
    }}>
      <div className="container-xl">
        {/* Top Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
              <div style={{
                width: 32, height: 32,
                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Zap size={16} color="white" fill="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Luminary<span style={{ color: '#A78BFA' }}>Hire</span>
              </span>
            </Link>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: 220 }}>
              AI-powered hiring that evaluates people, not just paper.
            </p>
            {/* Social */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              {[
                { Icon: X, href: '#', label: 'Twitter / X' },
                { Icon: Globe, href: '#', label: 'Website' },
                { Icon: Link2, href: '#', label: 'LinkedIn' },
              ].map(({ Icon, href, label }) => (
                <a key={label} href={href} aria-label={label} style={{
                  width: 34, height: 34,
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.4)';
                    (e.currentTarget as HTMLElement).style.color = '#A78BFA';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.08)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Candidates */}
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Candidates
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { href: '/jobs', label: 'Browse Jobs' },
                { href: '/support', label: 'How It Works' },
                { href: '/support', label: 'FAQ' },
                { href: '/support', label: 'Contact Support' },
              ].map(link => (
                <Link key={link.label} href={link.href} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Company
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { href: '#', label: 'About Us' },
                { href: '#', label: 'Blog' },
                { href: '#', label: 'Careers' },
                { href: '/admin/login', label: 'Recruiter Portal' },
              ].map(link => (
                <Link key={link.label} href={link.href} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Legal
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/privacy#terms', label: 'Terms of Service' },
                { href: '/privacy#ai', label: 'AI Usage Policy' },
                { href: '/privacy#data', label: 'Data Deletion Request' },
              ].map(link => (
                <Link key={link.label} href={link.href} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            © {currentYear} LuminaryHire, Inc. All rights reserved.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Built with care for fair hiring · No raw AI scores exposed to candidates
          </p>
        </div>
      </div>
    </footer>
  );
}
