import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Video, Mic, ArrowRight, CheckCircle2, Zap,
  Clock, Shield, Users, Star, ChevronRight,
  Play, Sparkles, Brain, BarChart3
} from 'lucide-react';

// ============================================================
// PAGE 1 — HOME / LANDING PAGE
// Purpose: First impression. Explains the platform's value
// proposition. Drives candidates to browse jobs.
//
// Sections:
//   1. Hero — headline, sub-copy, CTA buttons
//   2. Social proof — logos + stat strip
//   3. How It Works — 3-step process
//   4. Features — why this platform is different
//   5. Testimonials — candidate + recruiter quotes
//   6. Final CTA — "Ready to apply?" section
// ============================================================

export const metadata: Metadata = {
  title: 'LuminaryHire — Apply with a Video Intro, Not a Resume',
  description: 'AI-powered hiring platform. Record a 60-second video intro and get matched to jobs instantly. No résumé required.',
};

// ── Step data for "How It Works" section ──
const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Video,
    title: 'Record Your Intro',
    description: 'Spend 60–90 seconds talking about yourself and why you\'re a great fit. Use your camera, microphone, or upload a pre-recorded file.',
    accent: '#7C3AED',
  },
  {
    step: '02',
    icon: Brain,
    title: 'AI Matches You',
    description: 'Our AI transcribes your intro, analyzes your skills and experience, and scores your fit against the job requirements — fairly, consistently.',
    accent: '#4F46E5',
  },
  {
    step: '03',
    icon: Zap,
    title: 'Get an Instant Response',
    description: 'Receive a decision in your inbox within minutes, not weeks. Selected candidates get a link to schedule the next round immediately.',
    accent: '#06B6D4',
  },
];

// ── Why choose us section ──
const FEATURES = [
  {
    icon: Clock,
    title: 'Faster Than Traditional Hiring',
    description: 'Average time-to-decision is under 10 minutes. No waiting weeks to hear back.',
    color: '#7C3AED',
  },
  {
    icon: Shield,
    title: 'Built for Fairness',
    description: 'AI evaluates your words and skills — not your name, photo, or background. Every candidate gets the same fair evaluation.',
    color: '#4F46E5',
  },
  {
    icon: Users,
    title: 'Human Oversight Always',
    description: 'Recruiters review borderline cases and can override any AI decision. AI assists — humans decide.',
    color: '#06B6D4',
  },
  {
    icon: BarChart3,
    title: 'Transparent About AI',
    description: 'We never hide how AI is used. Your consent is required before any recording. You can request data deletion anytime.',
    color: '#10B981',
  },
];

// ── Testimonials ──
const TESTIMONIALS = [
  {
    name: 'Fatima Al-Hassan',
    role: 'Software Engineer',
    outcome: 'Hired at Luminary Labs',
    quote: 'I applied on my phone during my lunch break. Recorded a quick 90-second intro. Got an email with a decision by the time I got back to my desk. Fastest hiring process I\'ve ever been through.',
    avatar: 'FA',
    color: '#7C3AED',
  },
  {
    name: 'Chris Mendoza',
    role: 'Recruiting Lead',
    outcome: 'Luminary Labs Team',
    quote: 'We used to spend 3 weeks screening 200 applications. Now I review a shortlist of 10 qualified candidates in an afternoon. The AI catches things we\'d miss in a quick resume scan.',
    avatar: 'CM',
    color: '#4F46E5',
  },
  {
    name: 'Leah Nguyen',
    role: 'Product Designer',
    outcome: 'Hired within 48 hours',
    quote: 'I was skeptical about AI screening, but the process was transparent. I knew exactly what would be analyzed. No weird questions — just talk about what you\'ve built.',
    avatar: 'LN',
    color: '#06B6D4',
  },
];

// ── Company logos (text-based mock) ──
const COMPANY_LOGOS = ['Stripe', 'Figma', 'Linear', 'Vercel', 'Notion', 'Loom'];

export default function HomePage() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, overflow: 'hidden' }}>

        {/* ── HERO SECTION ── */}
        <section style={{ position: 'relative', padding: '5rem 0 6rem', overflow: 'hidden' }}>
          {/* Background Glows */}
          <div className="hero-glow glow-purple" style={{ width: 600, height: 600, top: -200, left: '50%', transform: 'translateX(-50%)' }} />
          <div className="hero-glow glow-blue" style={{ width: 400, height: 400, top: 100, right: -100 }} />
          <div className="hero-glow glow-cyan" style={{ width: 300, height: 300, bottom: -50, left: -50 }} />

          <div className="container-xl" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
              <span className="badge badge-purple">
                <Sparkles size={12} />
                AI-Powered Hiring — No Resume Required
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(2.5rem, 7vw, 5rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              marginBottom: '1.5rem',
              maxWidth: 900,
              margin: '0 auto 1.5rem',
            }}>
              Apply with your{' '}
              <span className="text-gradient">voice, not your résumé</span>
            </h1>

            {/* Sub-headline */}
            <p style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              color: 'var(--text-secondary)',
              maxWidth: 600,
              margin: '0 auto 2.5rem',
              lineHeight: 1.7,
            }}>
              Record a 60-second intro. Our AI matches you to the right job and responds within minutes — not weeks. Hiring that actually respects your time.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
              <Link href="/jobs" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
                Browse Open Roles <ArrowRight size={18} />
              </Link>
              <Link href="/support" className="btn-secondary" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
                <Play size={16} /> See How It Works
              </Link>
            </div>

            {/* Hero Card — Visual mock of recording UI */}
            <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
              <div className="glass-card-static" style={{
                padding: '2rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(124,58,237,0.1)',
              }}>
                {/* Mock video frame */}
                <div style={{
                  width: '100%',
                  aspectRatio: '16/7',
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {/* Gradient overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.2) 0%, transparent 70%)',
                  }} />

                  {/* Record button */}
                  <div style={{ position: 'relative', textAlign: 'center' }}>
                    <div style={{
                      width: 72, height: 72,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                      boxShadow: '0 0 30px rgba(124,58,237,0.6)',
                    }} className="animate-pulse-glow">
                      <Video size={28} color="white" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Click to start recording your intro
                    </p>
                  </div>

                  {/* Timer badge */}
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'rgba(239,68,68,0.9)',
                    borderRadius: 6, padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem', fontWeight: 700, color: 'white',
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', display: 'inline-block' }} />
                    00:00 / 01:30
                  </div>

                  {/* Microphone icon */}
                  <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8,
                      padding: '0.4rem 0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                    }}>
                      <Mic size={13} /> Record voice only
                    </div>
                  </div>
                </div>

                {/* Below video — options */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, background: 'rgba(124,58,237,0.1)', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid rgba(124,58,237,0.2)' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#A78BFA', marginBottom: '0.2rem' }}>🎥 Video Intro</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Record with camera + mic</p>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(6,182,212,0.08)', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid rgba(6,182,212,0.15)' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#67E8F9', marginBottom: '0.2rem' }}>🎙 Voice Only</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audio recording only</p>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>📁 Upload File</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MP4, MOV, MP3, WAV</p>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div style={{ position: 'absolute', top: -16, right: -16 }} className="animate-float">
                <div className="glass-card-static" style={{ padding: '0.6rem 1rem', borderRadius: 12, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34D399' }}>Decision in &lt; 10 min</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF STRIP ── */}
        <section style={{ padding: '2rem 0 3rem', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="container-xl">
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              Trusted by teams at
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', alignItems: 'center' }}>
              {COMPANY_LOGOS.map(name => (
                <span key={name} style={{
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '-0.02em',
                  opacity: 0.5,
                }}>
                  {name}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '2rem', marginTop: '3rem', textAlign: 'center' }}>
              {[
                { value: '12,000+', label: 'Applications Processed' },
                { value: '94%', label: 'Candidate Satisfaction' },
                { value: '8 min', label: 'Avg. Time to Decision' },
                { value: '3×', label: 'Faster Than Traditional Hiring' },
              ].map(stat => (
                <div key={stat.label}>
                  <p style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, background: 'linear-gradient(135deg, #A78BFA, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {stat.value}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="section-padding" id="how-it-works">
          <div className="container-xl">
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <span className="badge badge-purple" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
                Simple Process
              </span>
              <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', marginBottom: '1rem' }}>
                Apply in three steps
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 500, margin: '0 auto' }}>
                No cover letters. No form filling. Just talk about what you do best.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', position: 'relative' }}>
              {HOW_IT_WORKS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="glass-card" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                    {/* Step number watermark */}
                    <div style={{
                      position: 'absolute', top: -10, right: 16,
                      fontSize: '5rem', fontWeight: 900,
                      color: 'rgba(255,255,255,0.03)',
                      letterSpacing: '-0.05em',
                      lineHeight: 1,
                      userSelect: 'none',
                    }}>
                      {item.step}
                    </div>

                    {/* Icon */}
                    <div style={{
                      width: 52, height: 52,
                      borderRadius: 14,
                      background: `${item.accent}20`,
                      border: `1px solid ${item.accent}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1.25rem',
                    }}>
                      <Icon size={24} color={item.accent} />
                    </div>

                    {/* Step label */}
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: item.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                      Step {item.step}
                    </p>

                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{item.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>{item.description}</p>

                    {/* Arrow connector (not on last item) */}
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', zIndex: 10, display: 'none' }}>
                        <ChevronRight size={20} color="var(--text-muted)" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FEATURES / WHY US ── */}
        <section className="section-padding" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <div className="container-xl">
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <span className="badge badge-cyan" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
                Why LuminaryHire
              </span>
              <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', marginBottom: '1rem' }}>
                Hiring that{' '}
                <span className="text-gradient">respects everyone</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 500, margin: '0 auto' }}>
                Built on transparency, fairness, and speed — for candidates and recruiters.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {FEATURES.map(feat => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="glass-card" style={{ padding: '1.75rem' }}>
                    <div style={{
                      width: 44, height: 44,
                      borderRadius: 12,
                      background: `${feat.color}18`,
                      border: `1px solid ${feat.color}25`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                    }}>
                      <Icon size={20} color={feat.color} />
                    </div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.6rem' }}>{feat.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="section-padding">
          <div className="container-xl">
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', marginBottom: '1rem' }}>
                Real people, real results
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                From candidates and recruiters who've used the platform
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {TESTIMONIALS.map(t => (
                <div key={t.name} className="glass-card" style={{ padding: '1.75rem' }}>
                  {/* Stars */}
                  <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '1rem' }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} color="#F59E0B" fill="#F59E0B" />)}
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem', fontStyle: 'italic' }}>
                    "{t.quote}"
                  </p>

                  {/* Author */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 40, height: 40,
                      borderRadius: '50%',
                      background: `${t.color}30`,
                      border: `1px solid ${t.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: t.color,
                    }}>
                      {t.avatar}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.role} · {t.outcome}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ padding: '5rem 0' }}>
          <div className="container-xl">
            <div style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(79,70,229,0.1) 50%, rgba(6,182,212,0.08) 100%)',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: 24,
              padding: 'clamp(2rem, 5vw, 4rem)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* BG glow */}
              <div className="hero-glow glow-purple" style={{ width: 500, height: 300, top: -100, left: '50%', transform: 'translateX(-50%)' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', marginBottom: '1rem' }}>
                  Ready to apply?
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 480, margin: '0 auto 2.5rem' }}>
                  Browse open roles, record your intro in under 2 minutes, and get a response the same day.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                  <Link href="/jobs" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2.25rem' }}>
                    Browse Open Roles <ArrowRight size={18} />
                  </Link>
                  <Link href="/support" className="btn-secondary" style={{ fontSize: '1rem', padding: '0.875rem 2.25rem' }}>
                    Learn More
                  </Link>
                </div>

                <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No account required to apply · Your consent is always obtained before recording
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
