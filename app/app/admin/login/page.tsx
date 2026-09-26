// ============================================================
// PAGE 9 — ADMIN / RECRUITER LOGIN PAGE
// Route: /admin/login
//
// Purpose: Authentication gateway for all recruiter and admin
// accounts on the LuminaryHire platform. Candidates NEVER see
// this page. Only verified recruiter emails can authenticate.
//
// ── Security Rules ──────────────────────────────────────────
//   1. NEVER reveal whether an email exists in the system.
//      Always respond with "Invalid email or password" on failure.
//   2. Rate limit: lock after 5 consecutive failures.
//   3. Lockout shows a live countdown timer (15-minute window).
//   4. Password reset flow: always says "if that email is registered,
//      we sent a link" — never confirms/denies email existence.
//   5. No raw error details surfaced to the user.
//
// ── All States ──────────────────────────────────────────────
//   1. default              — clean form, empty, ready to fill
//   2. loading              — spinner during auth network call
//   3. invalid_credentials  — wrong email/password (generic)
//   4. empty_fields         — submit attempted with blank fields
//   5. invalid_email_format — non-email string in email field
//   6. account_locked       — 5+ failures, 15-min countdown timer
//   7. forgot_password      — email-only form shown
//   8. reset_loading        — sending the reset request
//   9. reset_sent           — always shows "check your email"
//   10. sso_loading          — Google SSO in progress state
//
// ── Edge Cases ──────────────────────────────────────────────
//   - Submitting blank form shows inline field errors
//   - Password peek/hide toggle with accessible label
//   - Enter key submits both forms
//   - Tab order correct: email > password > forgot > submit
//   - Remember me checkbox (persists session preference)
//   - Caps Lock warning on password field
//   - Rate limit resets when switching to forgot password and back
//   - Demo credentials panel (testing only — remove in prod)
//
// ── Demo Credentials ────────────────────────────────────────
//   Email:    admin@luminaryhire.com
//   Password: Admin@2026
//
// Functions:
//   AdminLoginPage()   — root component, view state machine
//   CountdownTimer()   — live lockout countdown clock
//   DemoCredBanner()   — testing hint (remove in production)
//   SSOButton()        — Google SSO visual stub
//   FieldError()       — inline validation error display
// ============================================================

'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle,
  CheckCircle2, Shield, KeyRound, ChevronLeft, Loader,
  ShieldAlert, Clock, Users, Video,
  Sparkles, AlertTriangle, Info, RefreshCw, Terminal
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type PageView = 'login' | 'forgot';

type LoginStatus =
  | 'idle'
  | 'loading'
  | 'error_credentials'
  | 'error_empty'
  | 'locked'
  | 'sso_loading';

type ForgotStatus = 'idle' | 'loading' | 'sent';

// ─────────────────────────────────────────────
// Demo credentials  (strip in production)
// ─────────────────────────────────────────────
const DEMO_EMAIL    = 'admin@luminaryhire.com';
const DEMO_PASSWORD = 'Admin@2026';
const MAX_ATTEMPTS  = 5;
const LOCKOUT_SECS  = 15 * 60; // 15 minutes

// ─────────────────────────────────────────────
// HELPER — basic email regex
// ─────────────────────────────────────────────
function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// ─────────────────────────────────────────────
// COUNTDOWN TIMER COMPONENT
// ─────────────────────────────────────────────
function CountdownTimer({ initialSeconds, onExpire }: { initialSeconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: '#FBBF24', letterSpacing: '0.05em' }}>
      {mm}:{ss}
    </span>
  );
}

// ─────────────────────────────────────────────
// DEMO CRED BANNER
// ─────────────────────────────────────────────
function DemoCredBanner({ onFill }: { onFill: (e: string, p: string) => void }) {
  const [copied, setCopied] = useState<'email' | 'pass' | null>(null);

  const copy = (text: string, field: 'email' | 'pass') => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div style={{
      marginTop: '1.5rem',
      padding: '0.85rem 1.1rem',
      background: 'rgba(124,58,237,0.06)',
      border: '1px dashed rgba(124,58,237,0.25)',
      borderRadius: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
        <Terminal size={13} style={{ color: '#A78BFA' }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Demo Credentials (Testing Only)
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {[
          { label: 'Email', value: DEMO_EMAIL, field: 'email' as const },
          { label: 'Pass',  value: DEMO_PASSWORD, field: 'pass' as const }
        ].map(({ label, value, field }) => (
          <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: 36 }}>{label}:</span>
            <code style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace', flex: 1, marginLeft: '0.35rem' }}>
              {value}
            </code>
            <button
              type="button"
              onClick={() => copy(value, field)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: copied === field ? '#10B981' : '#A78BFA',
                fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.4rem', fontFamily: 'inherit'
              }}
            >
              {copied === field ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onFill(DEMO_EMAIL, DEMO_PASSWORD)}
        style={{
          marginTop: '0.65rem', width: '100%', padding: '0.4rem',
          background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: 8, color: '#C4B5FD', fontSize: '0.78rem', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit'
        }}
      >
        Auto-fill Demo Credentials
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// INLINE FIELD ERROR
// ─────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', fontSize: '0.78rem', color: '#FCA5A5' }}>
      <AlertCircle size={12} style={{ flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// OR DIVIDER
// ─────────────────────────────────────────────
function OrDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>OR</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// GOOGLE SSO BUTTON
// ─────────────────────────────────────────────
function SSOButton({ isLoading, onClick }: { isLoading: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      id="sso-google-btn"
      onClick={onClick}
      disabled={isLoading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Continue with Google SSO"
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem',
        padding: '0.8rem 1.25rem',
        background: hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600,
        fontFamily: 'inherit', cursor: isLoading ? 'wait' : 'pointer',
        transition: 'all 0.2s ease', opacity: isLoading ? 0.7 : 1
      }}
    >
      {isLoading ? (
        <Loader size={18} style={{ animation: 'admin-spin 1s linear infinite' }} />
      ) : (
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
      )}
      <span>{isLoading ? 'Redirecting to Google...' : 'Continue with Google SSO'}</span>
    </button>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────
export default function AdminLoginPage() {
  const router = useRouter();
  const emailRef  = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<PageView>('login');

  // Login form state
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [loginStatus, setLoginStatus]   = useState<LoginStatus>('idle');
  const [failCount, setFailCount]       = useState(0);
  const [lockedAt, setLockedAt]         = useState<number | null>(null);
  const [capsLock, setCapsLock]         = useState(false);

  // Field-level errors
  const [emailError, setEmailError]       = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Forgot password state
  const [resetEmail, setResetEmail]         = useState('');
  const [forgotStatus, setForgotStatus]     = useState<ForgotStatus>('idle');
  const [resetEmailError, setResetEmailError] = useState('');

  // Focus email on mount / view change
  useEffect(() => {
    if (view === 'login') emailRef.current?.focus();
  }, [view]);

  const handleKeyCheck = (e: React.KeyboardEvent) => {
    setCapsLock(e.getModifierState('CapsLock'));
  };

  const handleEmailChange = (v: string) => {
    setEmail(v);
    if (emailError) setEmailError('');
    if (loginStatus !== 'idle' && loginStatus !== 'locked') setLoginStatus('idle');
  };

  const handlePasswordChange = (v: string) => {
    setPassword(v);
    if (passwordError) setPasswordError('');
    if (loginStatus !== 'idle' && loginStatus !== 'locked') setLoginStatus('idle');
  };

  // ── Validate login fields, set inline errors ──
  const validateLogin = (): boolean => {
    let ok = true;

    if (!email.trim()) {
      setEmailError('Email address is required.');
      ok = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address (e.g., recruiter@company.com).');
      ok = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      ok = false;
    }

    if (!ok) setLoginStatus('error_empty');
    return ok;
  };

  // ── Login submit ──
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (loginStatus === 'loading' || loginStatus === 'locked') return;
    if (!validateLogin()) return;

    setLoginStatus('loading');

    setTimeout(() => {
      if (email.trim().toLowerCase() === DEMO_EMAIL.toLowerCase() && password === DEMO_PASSWORD) {
        router.push('/admin/candidates');
      } else {
        const newFail = failCount + 1;
        setFailCount(newFail);
        if (newFail >= MAX_ATTEMPTS) {
          setLoginStatus('locked');
          setLockedAt(Date.now());
        } else {
          setLoginStatus('error_credentials');
        }
      }
    }, 800);
  };

  const handleLockExpire = () => {
    setLoginStatus('idle');
    setFailCount(0);
    setLockedAt(null);
    emailRef.current?.focus();
  };

  // ── Forgot password submit ──
  const handleForgotSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (forgotStatus === 'loading') return;

    if (!resetEmail.trim()) { setResetEmailError('Email address is required.'); return; }
    if (!isValidEmail(resetEmail)) { setResetEmailError('Enter a valid email address.'); return; }

    setResetEmailError('');
    setForgotStatus('loading');
    setTimeout(() => setForgotStatus('sent'), 1000);
  };

  // ── SSO demo ──
  const [ssoLoading, setSsoLoading] = useState(false);
  const handleSSOClick = () => {
    setSsoLoading(true);
    setTimeout(() => setSsoLoading(false), 2500);
  };

  const goToForgot = () => {
    setResetEmail(email);
    setView('forgot');
    setForgotStatus('idle');
    setResetEmailError('');
  };

  const goToLogin = () => {
    setView('login');
    setLoginStatus('idle');
    setEmailError('');
    setPasswordError('');
  };

  const lockoutRemaining = lockedAt
    ? Math.max(0, LOCKOUT_SECS - Math.floor((Date.now() - lockedAt) / 1000))
    : LOCKOUT_SECS;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* ══ LEFT BRANDING PANEL ════════════════════════════════ */}
      <div style={{
        flex: '0 0 42%',
        background: 'linear-gradient(145deg, #0F0A1E 0%, #1A0A2E 50%, #0D1220 100%)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        padding: '3rem 3.5rem',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Background glows */}
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-15%', width: 320, height: 320, background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 'auto' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,58,237,0.5)' }}>
              <Zap size={22} color="white" fill="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#fff' }}>
              Luminary<span style={{ color: '#A78BFA' }}>Hire</span>
            </span>
          </Link>
        </div>

        {/* Main copy */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, marginBottom: '1.5rem', width: 'fit-content' }}>
            <Shield size={13} style={{ color: '#A78BFA' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A78BFA', letterSpacing: '0.05em' }}>RECRUITER PORTAL</span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: '1rem', letterSpacing: '-0.025em' }}>
            AI-Powered<br />
            <span style={{ background: 'linear-gradient(135deg, #A78BFA, #60A5FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Hiring Intelligence
            </span>
          </h1>

          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 380, marginBottom: '2.5rem' }}>
            Manage job postings, review AI-screened video introductions, and make data-driven hiring decisions — all in one recruiter hub.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: <Video size={16} />, text: 'Review candidate video & voice intros', color: '#818CF8' },
              { icon: <Sparkles size={16} />, text: 'AI match scores and transcript analysis', color: '#C084FC' },
              { icon: <Users size={16} />, text: 'Full candidate pipeline management', color: '#67E8F9' },
              { icon: <Shield size={16} />, text: 'Recruiter override with full audit trail', color: '#34D399' },
            ].map(({ icon, text, color }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                  {icon}
                </div>
                <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security badge */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={14} style={{ color: '#10B981' }} />
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
            ISO 27001 certified &middot; DPDP Act compliant &middot; TLS 1.3 encrypted
          </span>
        </div>
      </div>

      {/* ══ RIGHT AUTH PANEL ═══════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: '30%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

        {/* Top bar */}
        <div style={{ padding: '1.5rem 2.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <Link
            href="/"
            aria-label="Back to main site"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'none', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', transition: 'all 0.2s' }}
          >
            <ChevronLeft size={14} />
            Back to site
          </Link>
        </div>

        {/* Form area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 2.5rem 3rem', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%', maxWidth: 400 }}>

            {/* ══════════════════════════════════════════
                LOGIN VIEW
                ══════════════════════════════════════════ */}
            {view === 'login' && (
              <div className="animate-fade-up">

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.12))', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 0 24px rgba(124,58,237,0.2)' }}>
                    <Shield size={26} color="#A78BFA" />
                  </div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>Welcome back</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                    Sign in to your recruiter account to manage the pipeline.
                  </p>
                </div>

                {/* STATE 6: Account Locked */}
                {loginStatus === 'locked' && (
                  <div role="alert" aria-live="assertive" className="alert-warning" style={{ marginBottom: '1.5rem', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                      <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.25rem' }}>Account temporarily locked</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.85, lineHeight: 1.5 }}>
                          {MAX_ATTEMPTS} failed login attempts detected. For security, your account is locked.
                        </p>
                      </div>
                    </div>
                    {/* Live countdown timer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', background: 'rgba(245,158,11,0.08)', borderRadius: 8, justifyContent: 'center' }}>
                      <Clock size={15} style={{ color: '#FBBF24' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unlocks in:</span>
                      <CountdownTimer key={lockedAt ?? 0} initialSeconds={lockoutRemaining} onExpire={handleLockExpire} />
                    </div>
                    <button
                      type="button"
                      onClick={goToForgot}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FBBF24', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'underline', fontFamily: 'inherit', textAlign: 'center', padding: 0 }}
                    >
                      Reset password instead &rarr;
                    </button>
                  </div>
                )}

                {/* STATE 3: Invalid credentials */}
                {loginStatus === 'error_credentials' && (
                  <div role="alert" aria-live="polite" className="alert-error" style={{ marginBottom: '1.25rem' }}>
                    <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.1rem' }}>Invalid email or password</p>
                      <p style={{ fontSize: '0.78rem', opacity: 0.85, lineHeight: 1.4 }}>
                        Please check your credentials and try again.
                        {failCount > 1 && (
                          <> Attempt <strong>{failCount}</strong> of {MAX_ATTEMPTS} before lockout.</>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* SSO Button */}
                <SSOButton isLoading={ssoLoading} onClick={handleSSOClick} />
                <OrDivider />

                {/* Login form */}
                <form onSubmit={handleLogin} noValidate aria-label="Recruiter sign-in form">
                  <div className="glass-card-static" style={{ padding: '1.75rem' }}>

                    {/* Email field */}
                    <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                      <label htmlFor="login-email" className="form-label">Work Email Address</label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        <input
                          id="login-email"
                          ref={emailRef}
                          type="email"
                          className="form-input"
                          placeholder="recruiter@company.com"
                          value={email}
                          onChange={e => handleEmailChange(e.target.value)}
                          onKeyDown={handleKeyCheck}
                          required
                          autoComplete="email"
                          aria-invalid={!!emailError}
                          disabled={loginStatus === 'locked'}
                          style={{ paddingLeft: '2.75rem', borderColor: emailError ? 'var(--accent-red)' : undefined }}
                        />
                      </div>
                      <FieldError message={emailError} />
                    </div>

                    {/* Password field */}
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label htmlFor="login-password" className="form-label">Password</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          className="form-input"
                          placeholder="Your password"
                          value={password}
                          onChange={e => handlePasswordChange(e.target.value)}
                          onKeyDown={handleKeyCheck}
                          required
                          autoComplete="current-password"
                          aria-invalid={!!passwordError}
                          disabled={loginStatus === 'locked'}
                          style={{ paddingLeft: '2.75rem', paddingRight: '3rem', borderColor: passwordError ? 'var(--accent-red)' : undefined }}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword(s => !s)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex', alignItems: 'center' }}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <FieldError message={passwordError} />

                      {/* Caps Lock warning */}
                      {capsLock && !passwordError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem', fontSize: '0.75rem', color: '#FBBF24' }}>
                          <AlertTriangle size={12} />
                          <span>Caps Lock is ON</span>
                        </div>
                      )}
                    </div>

                    {/* Remember me + Forgot password */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                        <input
                          type="checkbox"
                          id="remember-me"
                          checked={rememberMe}
                          onChange={e => setRememberMe(e.target.checked)}
                          className="custom-checkbox"
                        />
                        Remember me for 30 days
                      </label>

                      <button
                        type="button"
                        id="forgot-password-link"
                        onClick={goToForgot}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', fontSize: '0.82rem', fontWeight: 500, fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      id="login-submit-btn"
                      className="btn-primary"
                      disabled={loginStatus === 'loading' || loginStatus === 'locked'}
                      aria-busy={loginStatus === 'loading'}
                      style={{ width: '100%', justifyContent: 'center', padding: '0.88rem', fontSize: '0.95rem' }}
                    >
                      {loginStatus === 'loading' ? (
                        <><Loader size={16} style={{ animation: 'admin-spin 1s linear infinite' }} /> Verifying credentials...</>
                      ) : loginStatus === 'locked' ? (
                        <><ShieldAlert size={16} /> Account Locked</>
                      ) : (
                        <><Lock size={16} /> Sign In to Portal <ArrowRight size={16} /></>
                      )}
                    </button>
                  </div>
                </form>

                {/* Demo creds */}
                <DemoCredBanner onFill={(e, p) => { setEmail(e); setPassword(p); setLoginStatus('idle'); setEmailError(''); setPasswordError(''); }} />

                {/* Security note */}
                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.73rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                  <Shield size={12} />
                  Secured with TLS 1.3 &middot; Sessions are time-limited and audited
                </p>
              </div>
            )}

            {/* ══════════════════════════════════════════
                FORGOT PASSWORD VIEW
                ══════════════════════════════════════════ */}
            {view === 'forgot' && (
              <div className="animate-fade-up">

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 0 20px rgba(245,158,11,0.15)' }}>
                    <KeyRound size={26} color="#FCD34D" />
                  </div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>Reset Password</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, maxWidth: 340, margin: '0 auto' }}>
                    Enter your work email. If it&apos;s registered, we&apos;ll send a reset link right away.
                  </p>
                </div>

                {/* STATE 9: Reset sent confirmation */}
                {forgotStatus === 'sent' ? (
                  <div role="status" aria-live="polite" className="glass-card-static" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
                      <CheckCircle2 size={30} color="#34D399" />
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Check your inbox</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '0.5rem' }}>
                      If <strong style={{ color: 'var(--text-primary)' }}>{resetEmail}</strong> is registered with LuminaryHire, a password reset link has been dispatched. Check your inbox and spam folder.
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                      <Clock size={12} /> Link expires in 30 minutes
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <button onClick={goToLogin} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
                        <ArrowRight size={16} /> Back to Sign In
                      </button>
                      <button
                        onClick={() => { setForgotStatus('idle'); setResetEmail(''); }}
                        className="btn-ghost"
                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                      >
                        <RefreshCw size={14} /> Try a different email
                      </button>
                    </div>
                    <p style={{ marginTop: '1.5rem', fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      For security, we never confirm whether an email is registered with LuminaryHire.
                    </p>
                  </div>
                ) : (
                  /* Forgot form */
                  <form onSubmit={handleForgotSubmit} noValidate aria-label="Password reset request form">
                    <div className="glass-card-static" style={{ padding: '1.75rem' }}>
                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="reset-email" className="form-label">Registered Email Address</label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                          <input
                            id="reset-email"
                            type="email"
                            className="form-input"
                            placeholder="your.email@company.com"
                            value={resetEmail}
                            onChange={e => { setResetEmail(e.target.value); if (resetEmailError) setResetEmailError(''); }}
                            required
                            autoComplete="email"
                            aria-invalid={!!resetEmailError}
                            style={{ paddingLeft: '2.75rem', borderColor: resetEmailError ? 'var(--accent-red)' : undefined }}
                          />
                        </div>
                        <FieldError message={resetEmailError} />
                      </div>

                      <button
                        type="submit"
                        id="reset-submit-btn"
                        className="btn-primary"
                        disabled={forgotStatus === 'loading'}
                        aria-busy={forgotStatus === 'loading'}
                        style={{ width: '100%', justifyContent: 'center', padding: '0.88rem', marginBottom: '0.85rem' }}
                      >
                        {forgotStatus === 'loading' ? (
                          <><Loader size={16} style={{ animation: 'admin-spin 1s linear infinite' }} /> Sending reset link...</>
                        ) : (
                          <><Mail size={16} /> Send Reset Link</>
                        )}
                      </button>

                      <button
                        type="button"
                        id="back-to-login-btn"
                        onClick={goToLogin}
                        className="btn-ghost"
                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.88rem' }}
                      >
                        <ChevronLeft size={14} /> Back to Sign In
                      </button>
                    </div>

                    <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                      <Info size={11} />
                      We never confirm whether an email is registered.
                    </p>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style jsx global>{`
        @keyframes admin-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .left-panel-hide { display: none !important; }
        }
      `}</style>
    </div>
  );
}
