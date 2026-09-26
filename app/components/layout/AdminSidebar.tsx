// ============================================================
// SHARED ADMIN SIDEBAR COMPONENT
// Used by Pages 10, 11, 12 — the admin-facing portal.
//
// Props:
//   activeRoute — current path, used to highlight active item
// ============================================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap, Briefcase, Users,
  LogOut, PlusCircle, ChevronRight
} from 'lucide-react';

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

  const isActive = (href: string) => {
    if (href === '/admin/candidates') return pathname === href || pathname === '/admin/candidates';
    return pathname === href || pathname.startsWith(href + '/');
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

      {/* Bottom section */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0.75rem 0' }}>
        <button
          className="sidebar-item"
          onClick={() => { window.location.href = '/admin/login'; }}
          aria-label="Log out of recruiter portal"
          style={{ width: '100%', color: '#FCA5A5' }}
        >
          <LogOut size={18} />
          {!compact && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
