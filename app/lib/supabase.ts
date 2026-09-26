// ============================================================
// SUPABASE CLIENTS — Phase 2: Auth-aware clients
// ============================================================
//
// We need three separate Supabase clients:
//
//  1. Browser Client  — for 'use client' components
//     Uses createBrowserClient from @supabase/ssr so auth tokens
//     are stored in cookies and shared with the server.
//
//  2. Server Client   — for Server Components and Server Actions
//     Reads cookies but cannot write (read-only in RSC context).
//
//  3. Middleware Client — for middleware.ts
//     Can both read AND write cookies (needed to refresh tokens).
//
//  4. Admin client    — original singleton, kept for db.ts
//     queries that don't require per-request auth context.
// ============================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ── 1. Browser client (for client components) ──
export function createBrowserSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// ── 2. Server / RSC client (read-only cookies) ──
export function createServerSupabaseClient(cookieStore: ReadonlyRequestCookies) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Cannot write cookies in RSC — handled by middleware
      },
    },
  });
}

// ── 3. Middleware client (read + write cookies) ──
export function createMiddlewareSupabaseClient(
  request: Request,
  response: { headers: Headers }
) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.headers
          .get('cookie')
          ?.split('; ')
          .map(c => {
            const [name, ...rest] = c.split('=');
            return { name, value: rest.join('=') };
          }) ?? [];
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieStr = `${name}=${value}; Path=${options.path ?? '/'}; HttpOnly; SameSite=Lax${options.secure ? '; Secure' : ''}${options.maxAge ? `; Max-Age=${options.maxAge}` : ''}`;
          response.headers.append('Set-Cookie', cookieStr);
        });
      },
    },
  });
}

// ── 4. Singleton anon client (used by db.ts for data queries) ──
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
