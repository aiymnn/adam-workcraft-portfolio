'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BookingInfo {
  id: string;
  name: string;
  service: string;
}

interface PendingMedia {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function detectMediaType(file: File): 'image' | 'video' {
  if (file.type.startsWith('video/')) return 'video';
  return 'image';
}

// ---------------------------------------------------------------------------
// API helpers — real DB calls
// ---------------------------------------------------------------------------
async function verifyCodeApi(code: string): Promise<{ success: boolean; message?: string; booking?: BookingInfo }> {
  const res = await fetch('/api/public/reviews/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  return res.json() as Promise<{ success: boolean; message?: string; booking?: BookingInfo }>;
}

async function submitReviewApi(formData: FormData): Promise<{ success: boolean; message?: string }> {
  const res = await fetch('/api/public/reviews/submit', {
    method: 'POST',
    body: formData,
  });
  return res.json() as Promise<{ success: boolean; message?: string }>;
}

// ---------------------------------------------------------------------------
// Micro-components
// ---------------------------------------------------------------------------
function VerifyIcon() {
  return (
    <svg className="size-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg className="size-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-stone-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-3 text-sm text-stone-100 outline-none transition-all placeholder:text-stone-600 focus:border-amber-600/50 focus:ring-2 focus:ring-amber-600/20"
      />
    </div>
  );
}

function PublicMediaDropzone({
  title, hint, onDrop, onClick, className = ''
}: { title: string, hint: string, onDrop: (e: React.DragEvent<HTMLDivElement>) => void, onClick: () => void, className?: string }) {
  const [isActive, setIsActive] = useState(false);
  return (
    <div
      onClick={onClick}
      onDragOver={(e) => { e.preventDefault(); setIsActive(true); }}
      onDragEnter={(e) => { e.preventDefault(); setIsActive(true); }}
      onDragLeave={() => setIsActive(false)}
      onDrop={(e) => { e.preventDefault(); setIsActive(false); onDrop(e); }}
      className={`rounded-2xl border border-dashed px-6 py-6 text-center transition-all cursor-pointer ${
        isActive 
          ? 'border-amber-500/80 bg-amber-900/20 text-amber-100' 
          : 'border-stone-700 bg-stone-900/40 text-stone-500 hover:border-amber-700/50 hover:bg-stone-800/60'
      } ${className}`}
    >
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl border border-stone-800 bg-stone-900 shadow-inner">
        <svg className="size-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-stone-200">{title}</p>
      <p className="mt-1 text-xs text-stone-500">{hint}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function SubmitReviewPage() {
  return (
    <Suspense>
      <SubmitReviewContent />
    </Suspense>
  );
}

function SubmitReviewContent() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState<'code' | 'form' | 'success'>('code');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingInfo | null>(null);

  const [author, setAuthor] = useState('');
  const [role, setRole] = useState('');
  const [quote, setQuote] = useState('');
  
  const [mediaFiles, setMediaFiles] = useState<PendingMedia[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      mediaFiles.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    };
  }, [mediaFiles]);

  // Auto-verify if code is in the URL query param
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      const upper = codeParam.toUpperCase();
      setCode(upper);
      void verifyCode(upper);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyCode = useCallback(async (raw: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await verifyCodeApi(raw);
      if (!result.success || !result.booking) {
        setError(result.message || 'Invalid code. Please check and try again.');
        return;
      }
      setBooking(result.booking);
      setAuthor(result.booking.name);
      setRole(result.booking.service);
      setStep('form');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerify = useCallback(() => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter your review code.');
      return;
    }
    void verifyCode(trimmed);
  }, [code, verifyCode]);

  const processFiles = useCallback((files: File[]) => {
    const validFiles = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (validFiles.length < files.length) {
      setSubmitError('Some files were ignored because they are not images or videos.');
    }
    
    setMediaFiles(prev => {
      const newMedia = validFiles.map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type: detectMediaType(file)
      }));
      // Limit to 5 files maximum for public submission to prevent abuse
      const combined = [...prev, ...newMedia].slice(0, 5);
      return combined;
    });
  }, []);

  const handleDropMedia = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    // reset input so the same file can be selected again if removed
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processFiles]);

  const removeMedia = useCallback((id: string) => {
    setMediaFiles((prev) => {
      const item = prev.find(m => m.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(m => m.id !== id);
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!quote.trim() || !booking) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const formData = new FormData();
      formData.append('code', code.trim().toUpperCase());
      formData.append('author', author.trim());
      formData.append('role', role.trim());
      formData.append('quote', quote.trim());
      
      mediaFiles.forEach((m, index) => {
        formData.append(`file_${index}`, m.file);
      });

      const result = await submitReviewApi(formData);

      if (!result.success) {
        setSubmitError(result.message || 'Failed to submit review. Please try again.');
        return;
      }
      setStep('success');
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [quote, booking, code, mediaFiles, author, role]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0c0a09]">
      {/* Header */}
      <header className="border-b border-stone-800/60 bg-stone-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-bold tracking-tight text-stone-100 hover:text-amber-400 transition-colors">
            Adam Workcraft
          </Link>
          <Link href="/" className="text-xs text-stone-500 transition-colors hover:text-stone-300">
            ← Back to site
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          {/* Step 1: Code Entry */}
          {step === 'code' && (
            <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-8 shadow-2xl backdrop-blur-sm">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-stone-700 bg-stone-800/60">
                <KeyIcon />
              </div>
              <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-stone-100">Share Your Experience</h1>
              <p className="mb-8 text-center text-sm leading-relaxed text-stone-500">
                Enter the unique code you received via email to leave a review.
              </p>

              <div className="space-y-4">
                <div>
                  <input
                    value={code}
                    onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
                    className="w-full rounded-xl border border-stone-700 bg-stone-800/60 px-4 py-4 text-center text-2xl font-bold tracking-[0.35em] text-amber-400 outline-none transition-all placeholder:text-stone-700 placeholder:text-base placeholder:tracking-normal focus:border-amber-600/50 focus:ring-2 focus:ring-amber-600/20"
                    placeholder="XXXX-XXXX"
                    maxLength={9}
                    autoFocus
                  />
                  {error && (
                    <p className="mt-2.5 flex items-center gap-1.5 text-sm text-red-400">
                      <svg className="size-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="w-full rounded-xl bg-amber-500 px-4 py-3.5 text-sm font-bold text-stone-950 transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Verifying…' : 'Verify Code →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Review Form */}
          {step === 'form' && booking && (
            <div className="rounded-2xl border border-stone-800 bg-stone-900/60 shadow-2xl backdrop-blur-sm overflow-hidden">
              {/* Form header */}
              <div className="border-b border-stone-800 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-stone-100">Write Your Review</h2>
                    <p className="text-xs text-stone-500">Booking for <span className="text-stone-300">{booking.service}</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-6 py-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField label="Your Name" value={author} onChange={setAuthor} />
                  <InputField label="Service" value={role} onChange={setRole} />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-stone-500">Your Review *</label>
                  <textarea
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-3 text-sm text-stone-100 outline-none transition-all placeholder:text-stone-600 focus:border-amber-600/50 focus:ring-2 focus:ring-amber-600/20"
                    placeholder="Share your experience working with Adam..."
                  />
                </div>

                {/* Optional Media */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold tracking-wide uppercase text-stone-500">Photos / Videos (optional)</label>
                    <span className="text-[10px] text-stone-600">{mediaFiles.length} / 5</span>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />

                  {mediaFiles.length < 5 && (
                    <PublicMediaDropzone 
                      title="Upload files from your device"
                      hint="Drag and drop or click here (Max 5 files)"
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDropMedia}
                    />
                  )}

                  {mediaFiles.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {mediaFiles.map((m) => (
                        <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl border border-stone-800 bg-black">
                          {m.type === 'video' ? (
                            <video src={m.previewUrl} className="size-full object-cover" muted />
                          ) : (
                            <img src={m.previewUrl} className="size-full object-cover" alt="" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                          <button
                            onClick={() => removeMedia(m.id)}
                            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-lg bg-black/60 text-stone-300 opacity-0 backdrop-blur-md transition-all hover:bg-red-900/80 hover:text-red-300 group-hover:opacity-100"
                            title="Remove file"
                          >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          {m.type === 'video' && (
                            <div className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-stone-300 backdrop-blur-md">
                              VIDEO
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {submitError && (
                  <p className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2.5 text-sm text-red-400">{submitError}</p>
                )}
              </div>

              <div className="flex gap-3 border-t border-stone-800 px-6 py-4">
                <button
                  onClick={() => { setStep('code'); setBooking(null); setError(''); setSubmitError(''); }}
                  className="flex-none rounded-xl border border-stone-700 bg-stone-800 px-4 py-3 text-sm font-medium text-stone-300 transition-colors hover:bg-stone-700"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!quote.trim() || submitting}
                  className="flex-1 relative overflow-hidden rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-stone-950 transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className={`transition-opacity ${submitting ? 'opacity-0' : 'opacity-100'}`}>
                    Submit Review
                  </span>
                  {submitting && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2">
                      <svg className="size-4 animate-spin text-stone-900" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-10 text-center shadow-2xl backdrop-blur-sm">
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-emerald-800/50 bg-emerald-900/30">
                <VerifyIcon />
              </div>
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-stone-100">Thank You!</h2>
              <p className="mb-8 text-sm leading-relaxed text-stone-500">
                Your review has been submitted. We truly appreciate you sharing your experience — it means the world to us.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3.5 text-sm font-bold text-stone-950 transition-all hover:bg-amber-400"
              >
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
