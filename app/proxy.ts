// ============================================================
// NEXT.JS MIDDLEWARE — Phase 2: Auth Route Protection
// middleware.ts (must be at project root, next to app/)
//
// Protects all /admin/* routes except /admin/login.
// Uses Supabase SSR session cookie to verify authentication.
//
// Flow:
//  1. Request comes in for /admin/*
//  2. Middleware reads the Supabase session cookie
//  3. If no session → redirect to /admin/login?redirectTo=<url>
//  4. If session exists → allow through, refresh token if needed
//  5. /admin/login itself is always public (so unauthenticated
//     users can actually log in)
// ============================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin/* routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // /admin/login is always public — don't redirect here or we loop
  if (pathname === '/admin/login' || pathname.startsWith('/admin/reset-password')) {
    return NextResponse.next();
  }

  // Create a response object we can mutate (to refresh cookies)
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Build a middleware-capable Supabase client
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session if expired (does a token refresh if needed)
  const { data: { user } } = await supabase.auth.getUser();

  // If no authenticated user → redirect to login with return URL
  if (!user) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated — allow request through with refreshed cookies
  return response;
}

export const config = {
  // Run proxy only on /admin/* paths
  matcher: ['/admin/:path*'],
};
