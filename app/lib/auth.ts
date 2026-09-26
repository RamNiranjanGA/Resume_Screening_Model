// ============================================================
// AUTH SERVICE LAYER
// lib/auth.ts
//
// Centralises all authentication operations so pages/middleware
// only depend on this module, not on raw Supabase Auth calls.
//
// Functions:
//   signInWithEmail(email, password) — email/password login
//   signOut()                        — clear session + redirect
//   sendPasswordReset(email)         — password reset email
//   getSession()                     — get current session (browser)
//   getUser()                        — get current user (browser)
// ============================================================

'use client';

import { createBrowserSupabaseClient } from './supabase';

// Lazily create a single browser client instance per module
let browserClient: ReturnType<typeof createBrowserSupabaseClient> | null = null;

function getClient() {
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient();
  }
  return browserClient;
}

// ── Sign in with email + password ──
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      // Map Supabase error codes → generic safe messages (never reveal email existence)
      const msg = error.message.toLowerCase();
      if (
        msg.includes('invalid login') ||
        msg.includes('invalid credentials') ||
        msg.includes('email not confirmed') ||
        msg.includes('wrong password')
      ) {
        return { success: false, error: 'invalid_credentials' };
      }
      if (msg.includes('rate limit') || msg.includes('too many requests')) {
        return { success: false, error: 'rate_limited' };
      }
      return { success: false, error: 'unknown' };
    }

    if (!data.session) {
      return { success: false, error: 'invalid_credentials' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'unknown' };
  }
}

// ── Sign out ──
export async function signOut(): Promise<void> {
  try {
    const supabase = getClient();
    await supabase.auth.signOut();
  } catch {
    // Swallow errors — always navigate away
  }
}

// ── Send password reset email ──
export async function sendPasswordReset(
  email: string
): Promise<{ success: boolean }> {
  try {
    const supabase = getClient();
    // Always respond success — never confirm/deny email existence (security requirement)
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    return { success: true };
  } catch {
    // Still return success to avoid email enumeration
    return { success: true };
  }
}

// ── Get current session (client-side) ──
export async function getSession() {
  try {
    const supabase = getClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

// ── Get current user (client-side) ──
export async function getUser() {
  try {
    const supabase = getClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

// ── Subscribe to auth state changes ──
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const supabase = getClient();
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}
