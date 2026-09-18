// ============================================================
// LOADING STATE — /jobs/[id]
// Next.js App Router automatically shows this file while
// the page.tsx is resolving (server-side rendering).
// Matches the layout of the real job detail page exactly.
// ============================================================

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function JobDetailLoading() {
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        {/* Hero skeleton */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(124,58,237,0.08) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '3rem 0',
        }}>
          <div className="container-xl">
            {/* Breadcrumb */}
            <div className="skeleton" style={{ width: 160, height: 14, marginBottom: '1.5rem', borderRadius: 6 }} />

            {/* Badges row */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 20 }} />
              <div className="skeleton" style={{ width: 70, height: 24, borderRadius: 20 }} />
            </div>

            {/* Title */}
            <div className="skeleton" style={{ width: 420, height: 40, marginBottom: '0.75rem' }} />
            <div className="skeleton" style={{ width: 280, height: 20, marginBottom: '1.5rem' }} />

            {/* Meta row */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[130, 100, 140].map(w => (
                <div key={w} className="skeleton" style={{ width: w, height: 16 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Body skeleton */}
        <div className="container-xl" style={{ padding: '2.5rem 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
            {/* Left */}
            <div>
              {[1, 2].map(section => (
                <div key={section} className="glass-card-static" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                  <div className="skeleton" style={{ width: 160, height: 22, marginBottom: '1.25rem' }} />
                  {[100, 90, 95, 80, 88].map((w, i) => (
                    <div key={i} className="skeleton" style={{ width: `${w}%`, height: 14, marginBottom: 10 }} />
                  ))}
                </div>
              ))}
            </div>
            {/* Right */}
            <div>
              <div className="glass-card-static" style={{ padding: '1.75rem' }}>
                <div className="skeleton" style={{ width: '100%', height: 52, borderRadius: 26, marginBottom: '1.25rem' }} />
                <div className="skeleton" style={{ width: '100%', height: 120, borderRadius: 12 }} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
