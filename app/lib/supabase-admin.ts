// ============================================================
// SUPABASE ADMIN / SERVER STORAGE SERVICE
// lib/supabase-admin.ts
//
// Provides authenticated server-side access to Supabase Storage.
// Since the private "recordings" bucket has RLS enabled (only
// authenticated recruiters can read/SELECT), server routes
// (like /api/score and /api/recordings/play) use this module
// to authenticate with the recruiter admin account and obtain
// permissions to:
//   1. Download video/audio files for AI analysis
//   2. Generate fresh, unexpired signed URLs for the video player
//   3. Locate recordings by candidate ID when raw paths are missing
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const ADMIN_EMAIL = process.env.ADMIN_AUTH_EMAIL || 'admin@luminaryhire.com';
const ADMIN_PASSWORD = process.env.ADMIN_AUTH_PASSWORD || 'Admin@2026';

let cachedClient: SupabaseClient | null = null;
let tokenExpiryTimestamp = 0; // Unix epoch in seconds

/**
 * Returns an authenticated Supabase client using the admin credentials.
 * Automatically refreshes the session before token expiration.
 */
export async function getAdminStorageClient(): Promise<SupabaseClient> {
  const now = Math.floor(Date.now() / 1000);

  // Return cached client if token is still valid for at least 2 more minutes
  if (cachedClient && tokenExpiryTimestamp > now + 120) {
    return cachedClient;
  }

  const baseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await baseClient.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (error || !data?.session) {
    console.warn('getAdminStorageClient: auth failed, falling back to base client:', error?.message);
    return baseClient;
  }

  tokenExpiryTimestamp = data.session.expires_at || (now + 3600);

  cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    },
  });

  return cachedClient;
}

/**
 * Generate a fresh signed URL for any storage path in the recordings bucket.
 */
export async function createSignedRecordingUrl(
  storagePath: string,
  expirySeconds: number = 7200 // 2 hours
): Promise<string | null> {
  try {
    const cleanPath = storagePath
      .replace(/^recordings\//, '')
      .replace(/^\/+/, '');

    const client = await getAdminStorageClient();
    const { data, error } = await client.storage
      .from('recordings')
      .createSignedUrl(cleanPath, expirySeconds);

    if (error || !data?.signedUrl) {
      console.warn('createSignedRecordingUrl error:', error?.message);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.warn('createSignedRecordingUrl exception:', err);
    return null;
  }
}

/**
 * Download a file from the recordings bucket into a Buffer.
 */
export async function downloadRecordingBuffer(
  storagePath: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const cleanPath = storagePath
      .replace(/^recordings\//, '')
      .replace(/^\/+/, '');

    const client = await getAdminStorageClient();
    const { data, error } = await client.storage
      .from('recordings')
      .download(cleanPath);

    if (error || !data) {
      console.warn('downloadRecordingBuffer error:', error?.message);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    let mimeType = data.type || 'video/mp4';

    if (cleanPath.endsWith('.webm')) mimeType = 'video/webm';
    else if (cleanPath.endsWith('.mp4')) mimeType = 'video/mp4';
    else if (cleanPath.endsWith('.mov')) mimeType = 'video/quicktime';
    else if (cleanPath.endsWith('.mp3')) mimeType = 'audio/mp3';
    else if (cleanPath.endsWith('.wav')) mimeType = 'audio/wav';

    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType,
    };
  } catch (err) {
    console.warn('downloadRecordingBuffer exception:', err);
    return null;
  }
}

/**
 * Locate any uploaded recording file for a candidate by searching the recordings bucket.
 */
export async function findRecordingForCandidate(
  candidateId: string,
  jobId?: string
): Promise<string | null> {
  try {
    const client = await getAdminStorageClient();

    // 1. If jobId is provided, check direct folder
    if (jobId) {
      const { data: candFiles } = await client.storage
        .from('recordings')
        .list(`${jobId}/${candidateId}`);

      if (candFiles && candFiles.length > 0) {
        // Return newest file
        const file = candFiles[candFiles.length - 1];
        return `${jobId}/${candidateId}/${file.name}`;
      }

      // Check job folder root for any file matching candidateId
      const { data: jobFiles } = await client.storage
        .from('recordings')
        .list(jobId);

      if (jobFiles) {
        const match = jobFiles.find(f => f.name.includes(candidateId));
        if (match) return `${jobId}/${match.name}`;
      }
    }

    // 2. Search root folders
    const { data: rootItems } = await client.storage.from('recordings').list();
    if (!rootItems) return null;

    for (const item of rootItems) {
      // Check if folder
      const { data: subFiles } = await client.storage
        .from('recordings')
        .list(`${item.name}/${candidateId}`);

      if (subFiles && subFiles.length > 0) {
        const file = subFiles[subFiles.length - 1];
        return `${item.name}/${candidateId}/${file.name}`;
      }

      // Check if item name itself has candidateId
      if (item.name.includes(candidateId)) {
        return item.name;
      }
    }

    return null;
  } catch (err) {
    console.warn('findRecordingForCandidate exception:', err);
    return null;
  }
}
