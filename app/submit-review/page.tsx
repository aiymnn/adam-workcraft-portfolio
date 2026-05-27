'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loadBookings, saveBookings } from '@/lib/services/bookings';
import { loadReviews, saveReviews, generateId, type AdminReview, type ReviewMedia } from '@/lib/services/reviews';
import type { Booking } from '@/app/admin/schedule/_components/types';

function detectMediaType(src: string): 'image' | 'video' {
  const ext = src.split('?')[0].toLowerCase();
  if (ext.endsWith('.mp4') || ext.endsWith('.webm') || ext.endsWith('.mov') || ext.includes('/video-')) return 'video';
  return 'image';
}

function VerifyIcon() {
  return (
    <svg className="size-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function SubmitReviewPage() {
  return (
    <Suspense>
      <SubmitReviewContent />
    </Suspense>
  );
}

function SubmitReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<'code' | 'form' | 'success'>('code');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);

  const [author, setAuthor] = useState('');
  const [role, setRole] = useState('');
  const [quote, setQuote] = useState('');
  const [media, setMedia] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setReady(true);
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setCode(codeParam.toUpperCase());
      verifyCode(codeParam.toUpperCase());
    }
  }, []);

  const verifyCode = useCallback((raw: string) => {
    const bookings = loadBookings();
    const found = bookings.find((b) => b.reviewCode === raw);
    if (!found) {
      setError('Invalid code. Please check and try again.');
      return;
    }
    if (found.reviewSubmitted) {
      setError('This code has already been used to submit a review.');
      return;
    }
    setBooking(found);
    setAuthor(found.name);
    setRole(found.service);
    setStep('form');
    setError('');
  }, []);

  const handleVerify = useCallback(() => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter your review code.');
      return;
    }
    verifyCode(trimmed);
  }, [code, verifyCode]);

  const addMediaInput = useCallback(() => {
    if (media.length < 3) setMedia((prev) => [...prev, '']);
  }, [media.length]);

  const updateMedia = useCallback((index: number, value: string) => {
    setMedia((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const removeMedia = useCallback((index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!quote.trim() || !booking) return;
    setSubmitting(true);

    const collection: ReviewMedia[] = media
      .map((src) => src.trim())
      .filter(Boolean)
      .map((src) => ({ src, type: detectMediaType(src) }));

    const review: AdminReview = {
      id: generateId(),
      author: author.trim(),
      role: role.trim(),
      quote: quote.trim(),
      collection,
    };

    const reviews = loadReviews();
    reviews.push(review);
    saveReviews(reviews);

    const bookings = loadBookings();
    const updated = bookings.map((b) =>
      b.id === booking.id ? { ...b, reviewSubmitted: true } : b,
    );
    saveBookings(updated);

    setSubmitting(false);
    setStep('success');
  }, [quote, booking, media, author, role]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0a09]" />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0c0a09]">
      <header className="border-b border-[var(--border)] bg-black/40">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-[var(--text)] hover:text-amber-200/80">
            Adam Workcraft
          </Link>
          <Link href="/" className="text-xs text-[var(--text-dim)] transition-colors hover:text-[var(--text-muted)]">
            Back to site
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {step === 'code' && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-mid)] p-8 shadow-2xl">
              <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--button)]">
                <svg className="size-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <h1 className="mb-1 text-center text-xl font-bold text-[var(--text)]">Submit a Review</h1>
              <p className="mb-6 text-center text-xs text-[var(--text-dim)]">
                Enter the unique code you received to share your experience.
              </p>

              <div className="space-y-4">
                <div>
                  <input
                    value={code}
                    onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--button)] px-4 py-3 text-center text-lg font-bold tracking-[0.3em] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-dim)] placeholder:tracking-normal focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
                    placeholder="XXXX-XXXX"
                    maxLength={9}
                    autoFocus
                  />
                  {error && (
                    <p className="mt-2 text-center text-xs text-red-400">{error}</p>
                  )}
                </div>

                <button
                  onClick={handleVerify}
                  className="w-full rounded-lg bg-[var(--text)] px-4 py-2.5 text-sm font-medium text-[var(--bg-end)] transition-colors hover:opacity-90"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {step === 'form' && booking && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-mid)] shadow-2xl">
              <div className="border-b border-[var(--border)] px-6 py-4">
                <h2 className="text-sm font-semibold text-[var(--text)]">Share Your Experience</h2>
                <p className="mt-0.5 text-xs text-[var(--text-dim)]">
                  Booking for {booking.service}
                </p>
              </div>

              <div className="space-y-4 px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Name</label>
                    <input
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
                    />
                  </div>
                  <div className="sm:w-44">
                    <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Service</label>
                    <input
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Your Review</label>
                  <textarea
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-dim)] focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
                    placeholder="Write your review..."
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium text-[var(--text-dim)]">Media (optional)</label>
                    <span className="text-[10px] text-[var(--text-dim)]">{media.filter(Boolean).length} / 3</span>
                  </div>

                  <div className="space-y-2">
                    {media.map((url, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={url}
                          onChange={(e) => updateMedia(i, e.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-xs text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-dim)] focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
                          placeholder="https://images.unsplash.com/..."
                        />
                        {url.trim() && (
                          <button
                            onClick={() => window.open(url.trim(), '_blank')}
                            className="flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
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
                            className="flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-red-900/40 hover:text-red-300"
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
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-start)] px-3 py-2 text-xs font-medium text-[var(--text-dim)] transition-colors hover:border-amber-700/40 hover:text-amber-300/80"
                    >
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add Media
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 border-t border-[var(--border)] px-6 py-4">
                <button
                  onClick={() => { setStep('code'); setBooking(null); setError(''); }}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--button-hover)]"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!quote.trim() || submitting}
                  className="flex-1 rounded-lg bg-[var(--text)] px-3 py-2 text-sm font-medium text-[var(--bg-end)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-mid)] p-8 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-900/40">
                <VerifyIcon />
              </div>
              <h2 className="mb-1 text-xl font-bold text-[var(--text)]">Thank You!</h2>
              <p className="mb-6 text-xs text-[var(--text-dim)]">
                Your review has been submitted successfully. We appreciate your feedback!
              </p>
              <Link
                href="/"
                className="inline-block rounded-lg bg-[var(--text)] px-6 py-2.5 text-sm font-medium text-[var(--bg-end)] transition-colors hover:opacity-90"
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
