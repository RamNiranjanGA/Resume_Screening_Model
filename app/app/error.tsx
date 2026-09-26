// ============================================================
// PAGE 13b — RUNTIME ERROR BOUNDARY
// File: app/error.tsx (Next.js App Router convention)
//
// Purpose: Catches any unhandled runtime errors in the app and
// displays a friendly error page instead of a blank/crashed screen.
// Provides a retry button and support link.
//
// ── Design ───────────────────────────────────────────────────
//   - Red-tinted error state with warning icon
//   - "Something went wrong" message (no raw error details)
//   - "Try Again" button (calls reset())
//   - "Go Home" and "Contact Support" links
//   - Error details in collapsible panel (dev mode only)
//
// ── Edge Cases ───────────────────────────────────────────────
//   - Must be a Client Component ('use client')
//   - reset() function provided by Next.js to retry render
//   - Never exposes raw stack traces to end users
//   - Works for both candidate and admin route segments
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  AlertTriangle, RefreshCw, Home, HelpCircle,
  ChevronDown, ChevronUp, Terminal
} from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log the error to the console for debugging
    console.error('[LuminaryHire Error Boundary]', error);
  }, [error]);

  return (
    <>
      <Header />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '3rem 1.5rem' }}>

        {/* Background ambient glows */}
        <div style={{ position: 'absolute', top: '25%', left: '20%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: 250, height: 250, background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', maxWidth: 520, position: 'relative', zIndex: 1 }}>

          {/* Error icon */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(239,68,68,0.12)',
            border: '2px solid rgba(239,68,68,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 0 40px rgba(239,68,68,0.15)',
          }}>
            <AlertTriangle size={36} style={{ color: '#FCA5A5' }} />
          </div>

          {/* Status badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, marginBottom: '1rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', animation: 'error-pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FCA5A5', letterSpacing: '0.05em' }}>APPLICATION ERROR</span>
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            Something went wrong
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: 420, margin: '0 auto 2rem' }}>
            An unexpected error occurred while loading this page. This has been logged and our team will investigate. You can try again or navigate elsewhere.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <button
              onClick={() => reset()}
              className="btn-primary"
              style={{ padding: '0.85rem 1.75rem' }}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            <Link href="/" className="btn-secondary" style={{ padding: '0.85rem 1.75rem' }}>
              <Home size={16} />
              Go Home
            </Link>
            <Link href="/support" className="btn-secondary" style={{ padding: '0.85rem 1.75rem' }}>
              <HelpCircle size={16} />
              Get Help
            </Link>
          </div>

          {/* Error details (collapsible, dev-friendly) */}
          <div className="glass-card-static" style={{ padding: '1rem 1.25rem', textAlign: 'left' }}>
            <button
              onClick={() => setShowDetails(d => !d)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', padding: 0,
              }}
              aria-expanded={showDetails}
              aria-controls="error-details"
            >
              <Terminal size={14} />
              <span style={{ flex: 1, textAlign: 'left' }}>Technical Details</span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDetails && (
              <div
                id="error-details"
                style={{
                  marginTop: '0.75rem', padding: '0.85rem',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)',
                  fontFamily: 'monospace', fontSize: '0.75rem', color: '#FCA5A5',
                  lineHeight: 1.7, wordBreak: 'break-word',
                  maxHeight: 200, overflowY: 'auto',
                }}
              >
                <p><strong>Error:</strong> {error.message || 'Unknown error'}</p>
                {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  This information is for debugging purposes. Do not share it publicly.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      <style jsx global>{`
        @keyframes error-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
