'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
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

interface MediaItem {
  src: string;
  type: 'image' | 'video';
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function detectMediaType(src: string): 'image' | 'video' {
  const ext = src.split('?')[0].toLowerCase();
  if (ext.endsWith('.mp4') || ext.endsWith('.webm') || ext.endsWith('.mov') || ext.includes('/video-')) return 'video';
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

async function submitReviewApi(payload: {
  code: string;
  author: string;
  role: string;
  quote: string;
  collection: MediaItem[];
}): Promise<{ success: boolean; message?: string }> {
  const res = await fetch('/api/public/reviews/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
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
  const [media, setMedia] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

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

  const addMediaInput = useCallback(() => {
    if (media.length < 3) setMedia((prev) => [...prev, '']);
  }, [media.length]);

  const updateMedia = useCallback((index: number, value: string) => {
    setMedia((prev) => { const next = [...prev]; next[index] = value; return next; });
  }, []);

  const removeMedia = useCallback((index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!quote.trim() || !booking) return;
    setSubmitting(true);
    setSubmitError('');

    const collection: MediaItem[] = media
      .map((src) => src.trim())
      .filter(Boolean)
      .map((src) => ({ src, type: detectMediaType(src) }));

    try {
      const result = await submitReviewApi({
        code: code.trim().toUpperCase(),
        author: author.trim(),
        role: role.trim(),
        quote: quote.trim(),
        collection,
      });

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
  }, [quote, booking, code, media, author, role]);

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
                    <span className="text-[10px] text-stone-600">{media.filter(Boolean).length} / 3</span>
                  </div>
                  <div className="space-y-2">
                    {media.map((url, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={url}
                          onChange={(e) => updateMedia(i, e.target.value)}
                          className="min-w-0 flex-1 rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-2.5 text-xs text-stone-100 outline-none transition-all placeholder:text-stone-600 focus:border-amber-600/50 focus:ring-2 focus:ring-amber-600/20"
                          placeholder="https://example.com/photo.jpg"
                        />
                        {url.trim() && (
                          <button
                            onClick={() => window.open(url.trim(), '_blank')}
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-800 hover:text-stone-200"
                            title="Preview"
                          >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </button>
                        )}
                        {media.length > 1 && (
                          <button
                            onClick={() => removeMedia(i)}
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-stone-600 transition-colors hover:bg-red-950/50 hover:text-red-400"
                            title="Remove"
                          >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {media.length < 3 && (
                    <button
                      onClick={addMediaInput}
                      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-800 bg-stone-900/30 px-3 py-2.5 text-xs font-medium text-stone-600 transition-colors hover:border-amber-700/40 hover:text-amber-400"
                    >
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add Photo / Video URL
                    </button>
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
                  className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-stone-950 transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit Review'}
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
