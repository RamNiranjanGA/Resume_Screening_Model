// ============================================================
// SHARED ADMIN SIDEBAR COMPONENT
// Used by Pages 10, 11, 12 — the admin-facing portal.
//
// Phase 2: Connected to real Supabase Auth.
//   - Logout button calls signOut() from auth service
//   - User email shown in the bottom bar
//   - Falls back gracefully if auth is unavailable
// ============================================================

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Zap, Briefcase, Users,
  LogOut, PlusCircle, ChevronRight, Loader
} from 'lucide-react';
import { signOut, getUser } from '@/lib/auth';

interface AdminSidebarProps {
  /** Optional: collapse sidebar to icon-only on very small containers */
  compact?: boolean;
}

const NAV_ITEMS = [
  {
    label: 'Candidates',
    href: '/admin/candidates',
    icon: Users,
  },
  {
    label: 'Jobs',
    href: '/admin/jobs',
    icon: Briefcase,
    subItems: [
      { label: 'Post a New Job', href: '/admin/jobs/new', icon: PlusCircle },
    ],
  },
];

export default function AdminSidebar({ compact }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Load authenticated user's email for display
  useEffect(() => {
    getUser().then(user => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  const isActive = (href: string) => {
    if (href === '/admin/candidates') return pathname === href || pathname === '/admin/candidates';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.push('/admin/login');
      router.refresh(); // Force middleware to see cleared session
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="sidebar" style={{
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(124,58,237,0.4)', flexShrink: 0 }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          {!compact && (
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Luminary<span style={{ color: '#A78BFA' }}>Hire</span>
            </span>
          )}
        </Link>
        {!compact && (
          <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.5rem', background: 'rgba(124,58,237,0.12)', borderRadius: 20 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#A78BFA', letterSpacing: '0.06em' }}>RECRUITER PORTAL</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }} aria-label="Admin navigation">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`sidebar-item${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} />
                {!compact && <span style={{ flex: 1 }}>{item.label}</span>}
                {!compact && item.subItems && <ChevronRight size={14} style={{ opacity: 0.4 }} />}
              </Link>
              {/* Sub-items */}
              {!compact && item.subItems && (
                <div style={{ paddingLeft: '2.75rem' }}>
                  {item.subItems.map(sub => {
                    const SubIcon = sub.icon;
                    const subActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`sidebar-item${subActive ? ' active' : ''}`}
                        style={{ fontSize: '0.85rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                        aria-current={subActive ? 'page' : undefined}
                      >
                        <SubIcon size={14} />
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom section — user info + logout */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0.75rem 0' }}>
        {/* User email pill */}
        {!compact && userEmail && (
          <div style={{
            margin: '0 0.75rem 0.5rem',
            padding: '0.4rem 0.65rem',
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.18)',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <p style={{ fontSize: '0.65rem', color: '#A78BFA', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '0.1rem' }}>SIGNED IN AS</p>
            <p style={{
              fontSize: '0.72rem', color: 'var(--text-secondary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {userEmail}
            </p>
          </div>
        )}

        <button
          className="sidebar-item"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Log out of recruiter portal"
          style={{ width: '100%', color: loggingOut ? 'var(--text-muted)' : '#FCA5A5', cursor: loggingOut ? 'wait' : 'pointer' }}
        >
          {loggingOut ? <Loader size={18} style={{ animation: 'admin-spin 1s linear infinite' }} /> : <LogOut size={18} />}
          {!compact && <span>{loggingOut ? 'Signing out…' : 'Log Out'}</span>}
        </button>
      </div>
    </aside>
  );
}
