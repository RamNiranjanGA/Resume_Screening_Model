// ============================================================
// PAGE 5 — RECORDING / UPLOAD PAGE
// Route: /apply/[id]/record
//
// Purpose: Core application page where the candidate either
// (a) records a video/voice intro directly in the browser, or
// (b) uploads a pre-recorded file.
//
// This page is gated behind the Consent page (Page 4).
// In a production app you'd verify consent server-side; here
// we show a link back to consent if the user lands directly.
//
// States handled:
//   1. idle              — choose between Record or Upload
//   2. recording         — live preview, timer, stop button
//   3. preview           — playback of recorded/uploaded file,
//                          re-record + submit options
//   4. uploading         — progress bar during submission
//   5. submit-failed     — error message with retry button
//   6. unsupported       — browser doesn't support MediaRecorder;
//                          falls back to upload-only with message
//
// Key Functions:
//   RecordingPage()        — main page component, state machine
//   IdleState()            — choose Record Video, Record Audio, or Upload
//   RecordingState()       — live camera/mic preview, timer, stop
//   PreviewState()         — playback + re-record + submit
//   UploadingState()       — progress bar animation
//   ErrorState()           — submit failed + retry
//   UnsupportedBanner()    — shown when MediaRecorder not available
//   formatTime()           — converts seconds → mm:ss
//   formatFileSize()       — converts bytes → human-readable
// ============================================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getJobById } from '@/lib/mock-data';
import { fetchJobById, submitApplication } from '@/lib/db';
import { uploadRecording } from '@/lib/storage';
import { Job } from '@/lib/types';
import {
  Video, Mic, Upload, Play, Square, RotateCcw, Send,
  ChevronLeft, AlertTriangle, CheckCircle2, XCircle,
  Clock, FileVideo, FileAudio, HardDrive, Timer,
  Camera, MicOff, VideoOff, Pause, ArrowRight,
  Shield, Info, RefreshCw, X, File, AlertCircle,
  User, Mail, Phone, Briefcase
} from 'lucide-react';

// ── Constants ──
const MAX_DURATION_SECONDS = 120;     // 2 minutes
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const ACCEPTED_VIDEO_TYPES = '.mp4,.mov,.webm,.avi';
const ACCEPTED_AUDIO_TYPES = '.mp3,.wav,.ogg,.m4a';
const ACCEPTED_ALL_TYPES = `${ACCEPTED_VIDEO_TYPES},${ACCEPTED_AUDIO_TYPES}`;
const ACCEPTED_MIME_TYPES = [
  'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a',
];

// ── Page states (exhaustive) ──
type PageState = 'idle' | 'recording' | 'preview' | 'uploading' | 'error' | 'success';
type RecordMode = 'video' | 'audio';

// ─────────────────────────────────────────────
// UTILITY: Format seconds as mm:ss
// ─────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ─────────────────────────────────────────────
// UTILITY: Format bytes as human-readable size
// ─────────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─────────────────────────────────────────────
// UNSUPPORTED BANNER — shown when MediaRecorder
// is not available in the browser
// ─────────────────────────────────────────────
function UnsupportedBanner() {
  return (
    <div className="alert-warning" style={{ marginBottom: '1.5rem' }}>
      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.88rem' }}>
          Browser recording not supported
        </p>
        <p style={{ fontSize: '0.82rem', lineHeight: 1.55, opacity: 0.85 }}>
          Your browser doesn't support in-browser recording. You can still apply by uploading
          a pre-recorded video or audio file below.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CANDIDATE DETAILS FORM
// Collects candidate name, email, and contact info
// so recruiters can identify applicants without watching video
// ─────────────────────────────────────────────
function CandidateDetailsForm({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  headline,
  setHeadline,
  errors,
  clearError,
}: {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  headline: string;
  setHeadline: (v: string) => void;
  errors: { name?: string; email?: string };
  clearError: (field: 'name' | 'email') => void;
}) {
  return (
    <div className="glass-card-static" style={{ padding: '1.5rem 1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA'
        }}>
          <User size={18} />
        </div>
        <div>
          <h2 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Candidate Information
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
            Recruiters will see your name and email directly in their applicant list.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Full Name */}
        <div>
          <label htmlFor="cand-name" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Full Name <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="cand-name"
              type="text"
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) clearError('name');
              }}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${errors.name ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>
          {errors.name && (
            <span style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: 4, display: 'block' }}>
              {errors.name}
            </span>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="cand-email" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Email Address <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="cand-email"
              type="email"
              placeholder="e.g. priya.sharma@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) clearError('email');
              }}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${errors.email ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>
          {errors.email && (
            <span style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: 4, display: 'block' }}>
              {errors.email}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '0.85rem' }}>
        {/* Phone */}
        <div>
          <label htmlFor="cand-phone" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Phone Number <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>(Optional)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="cand-phone"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Headline */}
        <div>
          <label htmlFor="cand-headline" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Headline / Role Note <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>(Optional)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Briefcase size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="cand-headline"
              type="text"
              placeholder="e.g. Frontend Engineer · 3 yrs exp"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────
export default function RecordingPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  // ── Core state ──
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pageState, setPageState] = useState<PageState>('idle');
  const [recordMode, setRecordMode] = useState<RecordMode>('video');
  const [supportsRecording, setSupportsRecording] = useState(true);

  // ── Candidate info state ──
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidateHeadline, setCandidateHeadline] = useState('');
  const [formValidationErrors, setFormValidationErrors] = useState<{ name?: string; email?: string }>({});

  // ── Recording state ──
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [isVideo, setIsVideo] = useState(true);

  // ── Upload/submit state ──
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // ── Drag-and-drop ──
  const [isDragging, setIsDragging] = useState(false);

  // ── Refs ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch job data on mount ──
  useEffect(() => {
    fetchJobById(jobId).then(foundJob => {
      if (foundJob) {
        setJob(foundJob);
      } else {
        const local = getJobById(jobId);
        if (local) setJob(local);
        else setNotFound(true);
      }
      setLoading(false);
    });

    // Check browser support for MediaRecorder
    if (typeof window !== 'undefined') {
      const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      setSupportsRecording(hasMediaRecorder && hasGetUserMedia);

      // Load saved candidate contact info
      try {
        const savedName = localStorage.getItem('candidate_name');
        const savedEmail = localStorage.getItem('candidate_email');
        const savedPhone = localStorage.getItem('candidate_phone');
        const savedHeadline = localStorage.getItem('candidate_headline');
        if (savedName) setCandidateName(savedName);
        if (savedEmail) setCandidateEmail(savedEmail);
        if (savedPhone) setCandidatePhone(savedPhone);
        if (savedHeadline) setCandidateHeadline(savedHeadline);
      } catch {}
    }
  }, [jobId]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      // Stop any active media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Revoke blob URL
      if (mediaBlobUrl) {
        URL.revokeObjectURL(mediaBlobUrl);
      }
    };
  }, [mediaBlobUrl]);

  // ─────────────────────────────────────────
  // START RECORDING
  // Requests mic (+ camera for video mode).
  // Starts MediaRecorder and a timer.
  // Auto-stops at MAX_DURATION_SECONDS.
  // ─────────────────────────────────────────
  const startRecording = useCallback(async (mode: RecordMode) => {
    setRecordMode(mode);
    setIsVideo(mode === 'video');
    setElapsedSeconds(0);
    chunksRef.current = [];

    try {
      const constraints: MediaStreamConstraints = mode === 'video'
        ? { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      // Show live preview
      if (mode === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
      }

      // Start MediaRecorder
      const mimeType = mode === 'video'
        ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm')
        : (MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm');

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setMediaBlob(blob);
        setMediaBlobUrl(url);
        setFileSize(blob.size);
        setFileName(mode === 'video' ? 'recording.webm' : 'recording.webm');

        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;

        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setPageState('preview');
      };

      recorder.start(1000); // collect data every second
      setPageState('recording');

      // Start timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setElapsedSeconds(seconds);

        // Auto-stop at max duration
        if (seconds >= MAX_DURATION_SECONDS) {
          recorder.stop();
        }
      }, 1000);

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      // Permission denied or device not found
      if (errorMsg.includes('Permission') || errorMsg.includes('NotAllowed')) {
        setErrorMessage(
          'Camera/microphone access was denied. Please allow access in your browser settings and try again.'
        );
      } else if (errorMsg.includes('NotFound') || errorMsg.includes('DevicesNotFound')) {
        setErrorMessage(
          `No ${mode === 'video' ? 'camera' : 'microphone'} was detected. Please connect a device or try uploading a file instead.`
        );
      } else {
        setErrorMessage(
          `Could not start recording: ${errorMsg}. Try uploading a pre-recorded file instead.`
        );
      }
      setPageState('error');
    }
  }, []);

  // ─────────────────────────────────────────
  // STOP RECORDING
  // Triggers MediaRecorder.onstop which
  // transitions to 'preview' state.
  // ─────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ─────────────────────────────────────────
  // HANDLE FILE UPLOAD
  // Validates file type and size.
  // Transitions to 'preview' state on success.
  // ─────────────────────────────────────────
  const handleFileUpload = useCallback((file: File) => {
    // Validate MIME type
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setErrorMessage(
        `Unsupported file type: "${file.type || 'unknown'}". Please upload an MP4, MOV, WebM, MP3, WAV, or OGG file.`
      );
      setPageState('error');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `File is too large (${formatFileSize(file.size)}). Maximum allowed size is ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`
      );
      setPageState('error');
      return;
    }

    const isVideoFile = file.type.startsWith('video/');
    const url = URL.createObjectURL(file);

    setMediaBlob(file);
    setMediaBlobUrl(url);
    setFileName(file.name);
    setFileSize(file.size);
    setIsVideo(isVideoFile);
    setRecordMode(isVideoFile ? 'video' : 'audio');
    setPageState('preview');
  }, []);

  // ─────────────────────────────────────────
  // HANDLE DRAG & DROP
  // ─────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  // ─────────────────────────────────────────
  // RE-RECORD / RESET
  // Returns to idle state. Cleans up blob.
  // ─────────────────────────────────────────
  const resetToIdle = useCallback(() => {
    if (mediaBlobUrl) URL.revokeObjectURL(mediaBlobUrl);
    setMediaBlob(null);
    setMediaBlobUrl(null);
    setFileName(null);
    setFileSize(0);
    setElapsedSeconds(0);
    setErrorMessage('');
    setUploadProgress(0);
    setPageState('idle');
  }, [mediaBlobUrl]);

  // ─────────────────────────────────────────
  // SUBMIT RECORDING
  // 1. Validate candidate name and email
  // 2. Upload blob to Supabase Storage (with live progress).
  // 3. Save candidate record to DB with the returned signed URL.
  // 4. Navigate to confirmation page with candidate details.
  // Falls back gracefully if storage is unavailable.
  // ─────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!mediaBlob) return;

    // Validate applicant details
    const trimmedName = candidateName.trim();
    const trimmedEmail = candidateEmail.trim();
    const errors: { name?: string; email?: string } = {};

    if (!trimmedName) {
      errors.name = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    if (Object.keys(errors).length > 0) {
      setFormValidationErrors(errors);
      setErrorMessage('Please provide your name and a valid email address before submitting.');
      return;
    }

    // Save preferences locally
    try {
      localStorage.setItem('candidate_name', trimmedName);
      localStorage.setItem('candidate_email', trimmedEmail);
      if (candidatePhone) localStorage.setItem('candidate_phone', candidatePhone.trim());
      if (candidateHeadline) localStorage.setItem('candidate_headline', candidateHeadline.trim());
    } catch {}

    setPageState('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    // Generate a candidate ID upfront so storage path & DB row match
    const candidateId = `cand-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;

    // ── Step 1: Upload blob to Supabase Storage ──
    let recordingUrl = '';
    const uploadResult = await uploadRecording(
      mediaBlob,
      candidateId,
      jobId,
      (pct) => setUploadProgress(Math.min(pct, 90)), // reserve last 10% for DB write
    );

    if (uploadResult?.signedUrl) {
      recordingUrl = uploadResult.signedUrl;
    } else if (uploadResult?.path) {
      // Upload succeeded but signed URL generation failed — store the path
      recordingUrl = uploadResult.path;
    }
    // If uploadResult is null: Storage unavailable, continue anyway (resilient)

    // ── Step 2: Save application record to DB ──
    setUploadProgress(92);
    let generatedToken = '';
    try {
      const res = await submitApplication({
        jobId,
        jobTitle: job?.title || 'Applicant',
        candidateName: trimmedName,
        candidateEmail: trimmedEmail,
        recordingUrl,
        mode: recordMode,
        candidateId,
      });
      generatedToken = res.token;
    } catch (err) {
      console.warn('submitApplication failed:', err);
      // Continue — upload already happened; don't block the user
    }

    // ── Step 3: Navigate to confirmation ──
    setUploadProgress(100);
    setTimeout(() => {
      const queryParams = new URLSearchParams();
      if (generatedToken) queryParams.set('token', generatedToken);
      queryParams.set('name', trimmedName);
      queryParams.set('email', trimmedEmail);
      router.push(`/apply/${jobId}/confirm?${queryParams.toString()}`);
    }, 500);
  }, [mediaBlob, jobId, job, recordMode, candidateName, candidateEmail, candidatePhone, candidateHeadline, router]);

  // ── Loading state ──
  if (loading) {
    return (
      <>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1rem' }} />
            <div className="skeleton" style={{ width: 260, height: 20, margin: '0 auto 0.5rem' }} />
            <div className="skeleton" style={{ width: 180, height: 14, margin: '0 auto' }} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ── Job not found state ──
  if (notFound || !job) {
    return (
      <>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 440 }}>
            <div style={{
              width: 72, height: 72,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <AlertTriangle size={28} color="#FCD34D" />
            </div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Job Not Found</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              This role may have been filled or the link may have expired.
            </p>
            <Link href="/jobs" className="btn-primary">Browse Open Roles</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ─────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>

        {/* ── TOP BANNER ── */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(124,58,237,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '1.5rem 0',
        }}>
          <div className="container-lg">
            <Link href={`/apply/${job.id}/consent`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'none',
              marginBottom: '1rem',
            }}
              id="record-back-to-consent-link"
            >
              <ChevronLeft size={14} /> Back to Consent
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{
                padding: '0.2rem 0.65rem',
                background: 'rgba(6,182,212,0.12)',
                border: '1px solid rgba(6,182,212,0.25)',
                borderRadius: 20,
                fontSize: '0.7rem', fontWeight: 700,
                color: '#67E8F9', letterSpacing: '0.04em',
              }}>
                STEP 2 OF 3
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Record or Upload
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.6rem)', marginBottom: '0.25rem' }}>
              {pageState === 'recording' ? 'Recording in progress…' :
               pageState === 'preview' ? 'Review your submission' :
               pageState === 'uploading' ? 'Uploading…' :
               'Record your intro'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Applying for <strong style={{ color: 'var(--text-primary)' }}>{job.title}</strong> at {job.company}
            </p>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="container-lg" style={{ padding: '2rem 1.5rem 4rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 300px',
            gap: '2rem',
            alignItems: 'flex-start',
          }}>

            {/* ── LEFT COLUMN: Main content ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Unsupported browser banner */}
              {!supportsRecording && pageState === 'idle' && <UnsupportedBanner />}

              {/* ═══════════════════════════════════════
                  STATE 1: IDLE — Choose record or upload
                  ═══════════════════════════════════════ */}
              {pageState === 'idle' && (
                <>
                  {/* Candidate contact information form */}
                  <CandidateDetailsForm
                    name={candidateName}
                    setName={setCandidateName}
                    email={candidateEmail}
                    setEmail={setCandidateEmail}
                    phone={candidatePhone}
                    setPhone={setCandidatePhone}
                    headline={candidateHeadline}
                    setHeadline={setCandidateHeadline}
                    errors={formValidationErrors}
                    clearError={(field) => setFormValidationErrors(prev => ({ ...prev, [field]: undefined }))}
                  />

                  {/* Record options */}
                  {supportsRecording && (
                    <div className="glass-card-static" style={{ padding: '2rem' }}>
                      <h2 style={{
                        fontSize: '1rem', marginBottom: '0.5rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                      }}>
                        <span style={{ width: 4, height: 20, background: 'linear-gradient(#7C3AED, #4F46E5)', borderRadius: 2, display: 'inline-block' }} />
                        Record in Browser
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                        Use your device's camera and microphone to record a 60–90 second intro.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {/* Video record */}
                        <button
                          onClick={() => startRecording('video')}
                          id="record-video-btn"
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            gap: '0.85rem', padding: '2rem 1.5rem',
                            background: 'rgba(124,58,237,0.06)',
                            border: '1px solid rgba(124,58,237,0.2)',
                            borderRadius: 16, cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            color: 'var(--text-primary)',
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.12)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.4)';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(124,58,237,0.2)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.2)';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                          }}
                        >
                          <div style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.15))',
                            border: '1px solid rgba(124,58,237,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Camera size={24} color="#A78BFA" />
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                              Video Intro
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Camera + Microphone
                            </p>
                          </div>
                        </button>

                        {/* Audio-only record */}
                        <button
                          onClick={() => startRecording('audio')}
                          id="record-audio-btn"
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            gap: '0.85rem', padding: '2rem 1.5rem',
                            background: 'rgba(6,182,212,0.06)',
                            border: '1px solid rgba(6,182,212,0.2)',
                            borderRadius: 16, cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            color: 'var(--text-primary)',
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.12)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.4)';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(6,182,212,0.2)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.06)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.2)';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                          }}
                        >
                          <div style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: 'rgba(6,182,212,0.15)',
                            border: '1px solid rgba(6,182,212,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Mic size={24} color="#67E8F9" />
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                              Voice Only
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Microphone Only
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  {supportsRecording && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>
                        or upload a file
                      </span>
                      <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
                    </div>
                  )}

                  {/* Upload area */}
                  <div
                    className="glass-card-static"
                    style={{
                      padding: '2rem',
                      border: isDragging
                        ? '2px dashed rgba(124,58,237,0.5)'
                        : '1px solid var(--border-subtle)',
                      background: isDragging
                        ? 'rgba(124,58,237,0.08)'
                        : 'var(--bg-card)',
                      transition: 'all 0.2s ease',
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    id="upload-dropzone"
                  >
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: '1rem', padding: '1.5rem 0',
                    }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: 20,
                        background: isDragging
                          ? 'rgba(124,58,237,0.2)'
                          : 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}>
                        <Upload size={26} color={isDragging ? '#A78BFA' : 'var(--text-muted)'} />
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                          {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                          or click to browse
                        </p>
                      </div>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary"
                        id="upload-browse-btn"
                        style={{ padding: '0.65rem 1.5rem', fontSize: '0.88rem' }}
                      >
                        <Upload size={15} /> Choose File
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_ALL_TYPES}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                          // Reset input so the same file can be re-selected
                          e.target.value = '';
                        }}
                        id="file-upload-input"
                      />
                    </div>

                    {/* File specs */}
                    <div style={{
                      display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
                      gap: '1.25rem', marginTop: '0.5rem',
                      paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      {[
                        { icon: Clock, label: 'Max 2 minutes' },
                        { icon: HardDrive, label: 'Up to 100 MB' },
                        { icon: FileVideo, label: '.mp4 .mov .webm' },
                        { icon: FileAudio, label: '.mp3 .wav .ogg' },
                      ].map(({ icon: Icon, label }) => (
                        <span key={label} style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          color: 'var(--text-muted)', fontSize: '0.75rem',
                        }}>
                          <Icon size={13} /> {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ═══════════════════════════════════════
                  STATE 2: RECORDING — Live preview + timer
                  ═══════════════════════════════════════ */}
              {pageState === 'recording' && (
                <div className="glass-card-static" style={{ padding: '2rem', overflow: 'hidden' }}>

                  {/* Live preview area */}
                  <div style={{
                    position: 'relative',
                    borderRadius: 16, overflow: 'hidden',
                    background: '#000',
                    marginBottom: '1.5rem',
                    aspectRatio: isVideo ? '16/9' : undefined,
                    minHeight: isVideo ? undefined : 180,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isVideo ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{
                          width: '100%', height: '100%',
                          objectFit: 'cover',
                          transform: 'scaleX(-1)', // mirror front camera
                        }}
                      />
                    ) : (
                      /* Audio-only: visualiser placeholder */
                      <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: '1rem', padding: '2rem',
                      }}>
                        <div className="animate-pulse-glow" style={{
                          width: 80, height: 80, borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(124,58,237,0.2))',
                          border: '2px solid rgba(6,182,212,0.4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Mic size={32} color="#67E8F9" />
                        </div>
                        <p style={{ color: '#67E8F9', fontSize: '0.85rem', fontWeight: 500 }}>
                          Recording audio…
                        </p>
                      </div>
                    )}

                    {/* Recording indicator (top-left) */}
                    <div style={{
                      position: 'absolute', top: 16, left: 16,
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'rgba(0,0,0,0.7)',
                      backdropFilter: 'blur(8px)',
                      padding: '0.4rem 0.85rem',
                      borderRadius: 20,
                    }}>
                      <div className="animate-recording" style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#EF4444',
                      }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#FCA5A5' }}>
                        REC
                      </span>
                    </div>

                    {/* Timer (top-right) */}
                    <div style={{
                      position: 'absolute', top: 16, right: 16,
                      background: 'rgba(0,0,0,0.7)',
                      backdropFilter: 'blur(8px)',
                      padding: '0.4rem 0.85rem',
                      borderRadius: 20,
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                      <Timer size={13} color={elapsedSeconds > 90 ? '#FCD34D' : '#94A3B8'} />
                      <span style={{
                        fontSize: '0.82rem', fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        color: elapsedSeconds > 90 ? '#FCD34D' : '#F8FAFC',
                      }}>
                        {formatTime(elapsedSeconds)} / {formatTime(MAX_DURATION_SECONDS)}
                      </span>
                    </div>
                  </div>

                  {/* Duration progress bar */}
                  <div className="progress-bar" style={{ marginBottom: '1.25rem' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(elapsedSeconds / MAX_DURATION_SECONDS) * 100}%`,
                        background: elapsedSeconds > 90
                          ? 'linear-gradient(90deg, var(--accent-purple), var(--accent-amber))'
                          : undefined,
                      }}
                    />
                  </div>

                  {/* Duration guidance */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                    marginBottom: '1.5rem',
                  }}>
                    <span>Recommended: 60–90 seconds</span>
                    <span>{MAX_DURATION_SECONDS - elapsedSeconds}s remaining</span>
                  </div>

                  {/* Stop button */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={stopRecording}
                      id="stop-recording-btn"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.85rem 2.5rem',
                        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                        color: '#fff', fontWeight: 600, fontSize: '0.95rem',
                        borderRadius: 'var(--radius-full)',
                        border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
                        transition: 'all 0.25s ease',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(239,68,68,0.55)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(239,68,68,0.4)';
                      }}
                    >
                      <Square size={17} fill="white" /> Stop Recording
                    </button>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════
                  STATE 3: PREVIEW — Playback + re-record + submit
                  ═══════════════════════════════════════ */}
              {pageState === 'preview' && mediaBlobUrl && (
                <div className="glass-card-static" style={{ padding: '2rem' }}>

                  {/* Media playback */}
                  <div style={{
                    borderRadius: 16, overflow: 'hidden',
                    background: '#000',
                    marginBottom: '1.5rem',
                    aspectRatio: isVideo ? '16/9' : undefined,
                  }}>
                    {isVideo ? (
                      <video
                        ref={previewVideoRef}
                        src={mediaBlobUrl}
                        controls
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        id="preview-video-player"
                      />
                    ) : (
                      <div style={{
                        padding: '2.5rem', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: '1.25rem',
                      }}>
                        <div style={{
                          width: 72, height: 72, borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(124,58,237,0.15))',
                          border: '1px solid rgba(6,182,212,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Mic size={28} color="#67E8F9" />
                        </div>
                        <audio
                          ref={audioRef}
                          src={mediaBlobUrl}
                          controls
                          style={{ width: '100%', maxWidth: 400 }}
                          id="preview-audio-player"
                        />
                      </div>
                    )}
                  </div>

                  {/* File info bar */}
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '1rem',
                    padding: '0.85rem 1rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 10,
                    marginBottom: '1.5rem',
                  }}>
                    {[
                      { icon: isVideo ? FileVideo : FileAudio, label: fileName || 'Recording', color: '#A78BFA' },
                      { icon: HardDrive, label: formatFileSize(fileSize), color: '#67E8F9' },
                      ...(elapsedSeconds > 0 ? [{ icon: Clock, label: formatTime(elapsedSeconds), color: '#34D399' }] : []),
                    ].map(({ icon: Icon, label, color }) => (
                      <span key={label} style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        fontSize: '0.82rem', color: 'var(--text-secondary)',
                      }}>
                        <Icon size={14} color={color} /> {label}
                      </span>
                    ))}
                  </div>

                  {/* Candidate contact information form (review before submitting) */}
                  <CandidateDetailsForm
                    name={candidateName}
                    setName={setCandidateName}
                    email={candidateEmail}
                    setEmail={setCandidateEmail}
                    phone={candidatePhone}
                    setPhone={setCandidatePhone}
                    headline={candidateHeadline}
                    setHeadline={setCandidateHeadline}
                    errors={formValidationErrors}
                    clearError={(field) => setFormValidationErrors(prev => ({ ...prev, [field]: undefined }))}
                  />

                  {errorMessage && (
                    <div className="alert-warning" style={{ marginBottom: '1.25rem' }}>
                      <AlertCircle size={16} />
                      <span style={{ fontSize: '0.85rem' }}>{errorMessage}</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleSubmit}
                      className="btn-primary"
                      id="submit-recording-btn"
                      style={{ padding: '0.85rem 2rem', fontSize: '0.95rem' }}
                    >
                      <Send size={16} /> Submit Application
                    </button>

                    <button
                      onClick={resetToIdle}
                      className="btn-secondary"
                      id="re-record-btn"
                      style={{ padding: '0.85rem 1.5rem' }}
                    >
                      <RotateCcw size={15} /> Re-record
                    </button>
                  </div>

                  {/* Subtle note */}
                  <p style={{
                    marginTop: '1.25rem', fontSize: '0.78rem',
                    color: 'var(--text-muted)', lineHeight: 1.55,
                    display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
                  }}>
                    <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                    Review your recording carefully. Once submitted, our AI will begin
                    processing your intro immediately.
                  </p>
                </div>
              )}

              {/* ═══════════════════════════════════════
                  STATE 4: UPLOADING — Progress bar
                  ═══════════════════════════════════════ */}
              {pageState === 'uploading' && (
                <div className="glass-card-static" style={{
                  padding: '3rem 2rem', textAlign: 'center',
                }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1))',
                    border: '1px solid rgba(124,58,237,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                  }}>
                    <Send size={28} color="#A78BFA" className="animate-float" />
                  </div>

                  <h2 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
                    Uploading your submission…
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                    Please don't close this tab while we upload your recording.
                  </p>

                  {/* Progress bar */}
                  <div style={{ maxWidth: 400, margin: '0 auto' }}>
                    <div className="progress-bar" style={{ height: 6, marginBottom: '0.75rem' }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p style={{
                      fontSize: '0.85rem', fontWeight: 600,
                      color: '#A78BFA',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {Math.round(uploadProgress)}%
                    </p>
                  </div>

                  {/* File info */}
                  <div style={{
                    display: 'flex', justifyContent: 'center', gap: '1rem',
                    marginTop: '1.5rem',
                  }}>
                    {[
                      { icon: File, label: fileName || 'Recording' },
                      { icon: HardDrive, label: formatFileSize(fileSize) },
                    ].map(({ icon: Icon, label }) => (
                      <span key={label} style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        fontSize: '0.78rem', color: 'var(--text-muted)',
                      }}>
                        <Icon size={13} /> {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════
                  STATE 5: ERROR — Submit failed + retry
                  ═══════════════════════════════════════ */}
              {pageState === 'error' && (
                <div className="glass-card-static" style={{
                  padding: '2.5rem 2rem', textAlign: 'center',
                }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                  }}>
                    <XCircle size={28} color="#FCA5A5" />
                  </div>

                  <h2 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
                    Something went wrong
                  </h2>
                  <p style={{
                    color: 'var(--text-muted)', fontSize: '0.88rem',
                    lineHeight: 1.65, marginBottom: '2rem',
                    maxWidth: 420, margin: '0 auto 2rem',
                  }}>
                    {errorMessage || 'We couldn\'t process your submission. Please try again, or contact support if this keeps happening.'}
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={resetToIdle}
                      className="btn-primary"
                      id="error-retry-btn"
                      style={{ padding: '0.85rem 2rem' }}
                    >
                      <RefreshCw size={16} /> Try Again
                    </button>
                    <Link href="/support" className="btn-secondary" style={{ padding: '0.85rem 1.5rem' }}>
                      Contact Support
                    </Link>
                  </div>
                </div>
              )}

            </div>

            {/* ── RIGHT COLUMN: Sidebar ── */}
            <div style={{
              position: 'sticky', top: 90,
              display: 'flex', flexDirection: 'column', gap: '1.25rem',
            }}>

              {/* Tips card */}
              <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                <h3 style={{
                  fontWeight: 700, marginBottom: '1rem',
                  color: 'var(--text-secondary)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', fontSize: '0.72rem',
                }}>
                  Recording Tips
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { emoji: '🎯', text: 'Focus on your relevant experience and skills' },
                    { emoji: '⏱️', text: 'Aim for 60–90 seconds (sweet spot)' },
                    { emoji: '💡', text: 'Mention why you\'re excited about this role' },
                    { emoji: '🔇', text: 'Find a quiet space with good lighting' },
                    { emoji: '👀', text: 'Look at the camera and speak clearly' },
                    { emoji: '🔄', text: 'You can always re-record before submitting' },
                  ].map(({ emoji, text }) => (
                    <div key={text} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{emoji}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                <h3 style={{
                  fontWeight: 700, marginBottom: '1rem',
                  color: 'var(--text-secondary)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', fontSize: '0.72rem',
                }}>
                  File Requirements
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    { label: 'Duration', value: 'Max 2 minutes' },
                    { label: 'File size', value: 'Up to 100 MB' },
                    { label: 'Video', value: '.mp4, .mov, .webm' },
                    { label: 'Audio', value: '.mp3, .wav, .ogg' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '0.45rem 0',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      fontSize: '0.82rem',
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job context card */}
              <div className="glass-card-static" style={{ padding: '1.25rem' }}>
                <p style={{
                  fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem',
                }}>
                  Applying For
                </p>
                <p style={{
                  fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)',
                  marginBottom: '0.25rem',
                }}>
                  {job.title}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {job.company} · {job.location}
                </p>

                {/* Must-have skills reminder */}
                <p style={{
                  fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem',
                  marginTop: '0.5rem', paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                }}>
                  Key Skills to Highlight
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {job.mustHaveSkills.map(skill => (
                    <span key={skill} style={{
                      padding: '0.25rem 0.6rem',
                      background: 'rgba(124,58,237,0.1)',
                      border: '1px solid rgba(124,58,237,0.2)',
                      borderRadius: 14,
                      fontSize: '0.72rem', fontWeight: 600,
                      color: '#A78BFA',
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Consent confirmed badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.85rem 1.15rem',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.15)',
                borderRadius: 12,
              }}>
                <Shield size={15} color="#34D399" />
                <span style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 500 }}>
                  Consent confirmed — your data is protected
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Responsive styles ── */}
        <style>{`
          @media (max-width: 768px) {
            .container-lg > div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 500px) {
            /* Stack record buttons on very small screens */
            .container-lg > div[style*="gridTemplateColumns"] div[style*="grid-template-columns: 1fr 1fr"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

      </main>
      <Footer />
    </>
  );
}
