'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';

// ============================================================
// HEADER — Candidate-facing navigation bar
// Appears on all public pages. Shows logo + nav links.
// On mobile, collapses into a hamburger menu.
// ============================================================

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/jobs', label: 'Browse Jobs' },
    { href: '/support', label: 'Support' },
    { href: '/admin/login', label: 'Recruiter Login' },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(8,11,20,0.85)',
      }}
    >
      <div className="container-xl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
          }}>
            <Zap size={18} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Luminary<span style={{ color: '#A78BFA' }}>Hire</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="desktop-nav">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="btn-ghost"
              style={{
                color: pathname === link.href ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === link.href ? 600 : 500,
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/jobs" className="btn-primary" style={{ marginLeft: '0.5rem', padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}>
            View Open Roles
          </Link>
        </nav>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="btn-ghost mobile-menu-btn"
          style={{ padding: '0.5rem' }}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(8,11,20,0.97)',
          padding: '1rem 1.5rem 1.5rem',
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="btn-ghost"
                style={{ justifyContent: 'flex-start', fontSize: '1rem', padding: '0.75rem 0.5rem' }}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/jobs"
              className="btn-primary"
              style={{ marginTop: '0.5rem', justifyContent: 'center' }}
              onClick={() => setMenuOpen(false)}
            >
              View Open Roles
            </Link>
          </nav>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
}
