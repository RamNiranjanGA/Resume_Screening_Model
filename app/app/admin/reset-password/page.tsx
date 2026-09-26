'use client';

// ============================================================
// PASSWORD RESET PAGE
// Route: /admin/reset-password
//
// Shown when a recruiter clicks the reset link in their email.
// Supabase automatically sets the session from the URL hash
// fragment, so we can immediately let them set a new password.
// ============================================================

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
  Loader, KeyRound, Zap, ArrowLeft
} from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase';

function isStrongPassword(p: string) {
  // Min 8 chars, 1 uppercase, 1 number
  return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p);
}

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  type Status = 'idle' | 'loading' | 'success' | 'error' | 'no_session';
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [passError, setPassError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  // On mount, verify we have an active session from the email link
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setStatus('no_session');
      }
    });
  }, []);

  const validate = () => {
    let ok = true;
    if (!password) {
      setPassError('New password is required.');
      ok = false;
    } else if (!isStrongPassword(password)) {
      setPassError('Password must be at least 8 characters with one uppercase letter and one number.');
      ok = false;
    } else {
      setPassError('');
    }
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      ok = false;
    } else {
      setConfirmError('');
    }
    return ok;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    if (!validate()) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMsg(error.message || 'Could not update password. The link may have expired.');
        setStatus('error');
      } else {
        setStatus('success');
        setTimeout(() => router.push('/admin/candidates'), 2000);
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
      setStatus('error');
    }
  };

  // ── Invalid/expired link ──
  if (status === 'no_session') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <AlertCircle size={28} color="#FCA5A5" />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>Link Expired or Invalid</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            This password reset link has expired or already been used. Please request a new reset link.
          </p>
          <Link href="/admin/login" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem' }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (status === 'success') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 size={28} color="#34D399" />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>Password Updated!</h1>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Your password has been changed successfully. Redirecting you to the admin portal…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
      <div style={{ maxWidth: 440, width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}>
            <Zap size={22} color="white" fill="white" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>Set New Password</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Choose a strong password for your LuminaryHire admin account.
          </p>
        </div>

        <div className="glass-card-static" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Error banner */}
            {status === 'error' && errorMsg && (
              <div role="alert" style={{
                display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                padding: '0.85rem 1rem',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10,
              }}>
                <AlertCircle size={16} color="#FCA5A5" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.85rem', color: '#FCA5A5' }}>{errorMsg}</span>
              </div>
            )}

            {/* New password */}
            <div>
              <label htmlFor="new-password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                  <Lock size={16} />
                </div>
                <input
                  id="new-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (passError) setPassError(''); }}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  autoComplete="new-password"
                  style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '3rem', boxSizing: 'border-box' }}
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', fontSize: '0.78rem', color: '#FCA5A5' }}>
                  <AlertCircle size={12} /><span>{passError}</span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm-password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                  <KeyRound size={16} />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); if (confirmError) setConfirmError(''); }}
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                  style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '3rem', boxSizing: 'border-box' }}
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', fontSize: '0.78rem', color: '#FCA5A5' }}>
                  <AlertCircle size={12} /><span>{confirmError}</span>
                </div>
              )}
            </div>

            {/* Requirements hint */}
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.15)',
              borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55,
            }}>
              Password must be <strong style={{ color: 'var(--text-secondary)' }}>at least 8 characters</strong> long and contain at least one <strong style={{ color: 'var(--text-secondary)' }}>uppercase letter</strong> and one <strong style={{ color: 'var(--text-secondary)' }}>number</strong>.
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary"
              disabled={status === 'loading'}
              style={{ padding: '0.9rem', fontSize: '0.95rem', width: '100%', justifyContent: 'center' }}
            >
              {status === 'loading' ? (
                <><Loader size={16} style={{ animation: 'admin-spin 1s linear infinite' }} /> Updating Password…</>
              ) : (
                <><CheckCircle2 size={16} /> Set New Password</>
              )}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/admin/login" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
