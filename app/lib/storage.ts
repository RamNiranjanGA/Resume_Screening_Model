// ============================================================
// STORAGE SERVICE LAYER
// lib/storage.ts
//
// Handles all Supabase Storage interactions for the platform.
// All video/audio recordings are stored in the "recordings" bucket.
//
// Functions:
//   uploadRecording(blob, candidateId, jobId, onProgress)
//     Uploads a Blob to Supabase Storage.
//     Returns the signed URL (valid 7 days) or null on failure.
//
//   getSignedRecordingUrl(path)
//     Generates a short-lived signed URL for a storage path.
//     Used by the admin page to play back candidate recordings.
//
//   deleteRecording(path)
//     Deletes a recording from storage. Used when a candidate
//     record is deleted.
//
// Storage path format:
//   recordings/{jobId}/{candidateId}/{timestamp}.{ext}
// ============================================================

import { createBrowserSupabaseClient } from './supabase';

const BUCKET = 'recordings';
// Signed URLs expire after 7 days (604800 seconds)
const SIGNED_URL_EXPIRY_SECS = 60 * 60 * 24 * 7;

// ── Derive file extension from MIME type ──
function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'video/webm': 'webm',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
  };
  return map[mime] || 'webm';
}

// ── Build a deterministic storage path ──
export function buildStoragePath(
  candidateId: string,
  jobId: string,
  mimeType: string
): string {
  const ext = extFromMime(mimeType);
  const ts = Date.now();
  return `${jobId}/${candidateId}/${ts}.${ext}`;
}

// ── Upload a recording blob ──
export async function uploadRecording(
  blob: Blob,
  candidateId: string,
  jobId: string,
  onProgress?: (pct: number) => void
): Promise<{ path: string; signedUrl: string } | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    const path = buildStoragePath(candidateId, jobId, blob.type);

    // Supabase JS v2 doesn't expose upload progress natively via XHR,
    // so we simulate progress during the upload tick then snap to 100.
    let simulatedProgress = 0;
    const progressInterval = setInterval(() => {
      // Ramp up to ~85% while the real upload is in progress
      simulatedProgress = Math.min(simulatedProgress + Math.random() * 8 + 4, 85);
      onProgress?.(Math.round(simulatedProgress));
    }, 200);

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, {
        contentType: blob.type || 'video/webm',
        upsert: false,
      });

    clearInterval(progressInterval);

    if (error || !data?.path) {
      console.warn('Storage upload error:', error?.message);
      onProgress?.(100); // snap so UI doesn't hang
      return null;
    }

    onProgress?.(95);

    // Try generating a signed URL via client if available
    let signedUrl = '';
    try {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(data.path, SIGNED_URL_EXPIRY_SECS);
      if (signed?.signedUrl) {
        signedUrl = signed.signedUrl;
      }
    } catch {}

    // Fallback: If client signing fails (e.g. anonymous RLS), provide the server streaming endpoint
    if (!signedUrl) {
      signedUrl = `/api/recordings/play?path=${encodeURIComponent(data.path)}`;
    }

    onProgress?.(100);

    return { path: data.path, signedUrl };
  } catch (err) {
    console.warn('uploadRecording exception:', err);
    onProgress?.(100);
    return null;
  }
}

// ── Generate a fresh signed URL for an existing path ──
export async function getSignedRecordingUrl(
  storagePath: string,
  expirySeconds = SIGNED_URL_EXPIRY_SECS
): Promise<string | null> {
  try {
    // Try server-side authenticated signing endpoint first
    try {
      const res = await fetch(`/api/recordings/play?path=${encodeURIComponent(storagePath)}&json=true`);
      if (res.ok) {
        const json = await res.json();
        if (json?.url) return json.url;
      }
    } catch {}

    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, expirySeconds);

    if (error || !data?.signedUrl) {
      return `/api/recordings/play?path=${encodeURIComponent(storagePath)}`;
    }
    return data.signedUrl;
  } catch {
    return `/api/recordings/play?path=${encodeURIComponent(storagePath)}`;
  }
}

// ── Delete a recording from storage ──
export async function deleteRecording(storagePath: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath]);
    return !error;
  } catch {
    return false;
  }
}

// ── Check if a URL is a Supabase storage path (not a mock URL) ──
export function isStoragePath(url: string): boolean {
  // Real storage paths don't start with http
  return !!url && !url.startsWith('http') && !url.startsWith('/');
}

// ── Check if a URL is a signed Supabase URL ──
export function isSignedUrl(url: string): boolean {
  return !!url && url.includes('supabase') && url.includes('token=');
}
