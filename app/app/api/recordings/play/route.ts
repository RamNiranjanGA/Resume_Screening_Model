// ============================================================
// API ROUTE — RECORDINGS PLAYBACK & SIGNING
// Route: /api/recordings/play
//
// Purpose:
// Generates fresh, authenticated signed URLs for candidate
// video/audio recordings and automatically redirects browser
// video players (<video src="...">) or returns JSON URLs for
// dynamic client refresh.
//
// Solves:
//   - Expired 7-day signed URLs
//   - Private bucket RLS blocking anonymous browser clients
//   - Relative storage paths in <video> tags
//   - Automatically finds missing recording files for candidates
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSignedRecordingUrl, findRecordingForCandidate } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPath = searchParams.get('path');
    const candidateId = searchParams.get('candidateId');
    const jobId = searchParams.get('jobId');
    const returnJson = searchParams.get('json') === 'true' ||
      request.headers.get('accept')?.includes('application/json');

    let resolvedPath: string | null = null;

    // 1. If explicit path provided
    if (rawPath) {
      if (rawPath.startsWith('http')) {
        // Extract storage path from signed URL if possible
        const match = rawPath.match(/\/recordings\/([^?]+)/);
        if (match && match[1]) {
          resolvedPath = decodeURIComponent(match[1]);
        } else {
          // It's an external URL, just redirect or return it
          if (returnJson) {
            return NextResponse.json({ success: true, url: rawPath });
          }
          return NextResponse.redirect(rawPath, 302);
        }
      } else {
        resolvedPath = rawPath.replace(/^recordings\//, '').replace(/^\/+/, '');
      }
    }

    // 2. If no path, look up via candidateId in DB or Storage
    if (!resolvedPath && candidateId) {
      // Check database first
      try {
        const { data: cand } = await supabase
          .from('candidates')
          .select('recording_url, job_id')
          .eq('id', candidateId)
          .single();

        if (cand?.recording_url) {
          if (cand.recording_url.startsWith('http')) {
            const match = cand.recording_url.match(/\/recordings\/([^?]+)/);
            if (match && match[1]) {
              resolvedPath = decodeURIComponent(match[1]);
            } else {
              if (returnJson) {
                return NextResponse.json({ success: true, url: cand.recording_url });
              }
              return NextResponse.redirect(cand.recording_url, 302);
            }
          } else {
            resolvedPath = cand.recording_url.replace(/^recordings\//, '').replace(/^\/+/, '');
          }
        }

        // If still no path, search bucket directly
        if (!resolvedPath) {
          const discovered = await findRecordingForCandidate(candidateId, jobId || cand?.job_id);
          if (discovered) {
            resolvedPath = discovered;
            // Backfill candidate's DB row so next time is immediate
            await supabase
              .from('candidates')
              .update({ recording_url: discovered })
              .eq('id', candidateId);
          }
        }
      } catch (err) {
        console.warn('/api/recordings/play DB lookup error:', err);
      }
    }

    if (!resolvedPath) {
      if (returnJson) {
        return NextResponse.json(
          { success: false, error: 'Recording path or candidate recording not found' },
          { status: 404 }
        );
      }
      return new NextResponse('Recording not found', { status: 404 });
    }

    // Generate fresh signed URL (2 hours)
    const signedUrl = await createSignedRecordingUrl(resolvedPath, 7200);

    if (!signedUrl) {
      if (returnJson) {
        return NextResponse.json(
          { success: false, error: 'Could not generate signed URL for recording' },
          { status: 500 }
        );
      }
      return new NextResponse('Could not generate signed URL', { status: 500 });
    }

    if (returnJson) {
      return NextResponse.json({
        success: true,
        url: signedUrl,
        path: resolvedPath,
      });
    }

    // Redirect the HTML5 video/audio player directly to the signed Supabase CDN stream
    return NextResponse.redirect(signedUrl, 302);
  } catch (err: any) {
    console.error('/api/recordings/play unhandled error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
