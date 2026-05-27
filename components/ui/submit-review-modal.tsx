'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { loadBookings } from '@/lib/services/bookings';

interface SubmitReviewModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SubmitReviewModal({ open, onClose }: SubmitReviewModalProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!overlayRef.current || !panelRef.current) return;
    document.body.style.overflow = 'hidden';
    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      gsap.fromTo(panelRef.current, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'power2.out' });
    });
    return () => { ctx.revert(); document.body.style.overflow = ''; };
  }, [open]);

  const handleClose = useCallback(() => {
    if (!overlayRef.current || !panelRef.current) return;
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
    gsap.to(panelRef.current, { scale: 0.92, opacity: 0, duration: 0.2, onComplete: onClose });
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'Enter') handleVerify();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, handleClose]);

  const handleVerify = useCallback(() => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedEmail) { setError('Please enter your email address.'); return; }
    if (!trimmedCode) { setError('Please enter your review code.'); return; }

    setVerifying(true);
    setError('');

    const bookings = loadBookings();
    const found = bookings.find(
      (b) => b.email.toLowerCase() === trimmedEmail && b.reviewCode === trimmedCode,
    );

    if (!found) {
      setError('No booking found with this email and code combination.');
      setVerifying(false);
      return;
    }

    if (found.reviewSubmitted) {
      setError('A review has already been submitted for this booking.');
      setVerifying(false);
      return;
    }

    setVerifying(false);
    onClose();
    router.push(`/submit-review?code=${trimmedCode}`);
  }, [email, code, onClose, router]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={handleClose}
    >
      <div
        ref={panelRef}
        className="w-full rounded-t-xl border border-[var(--border)] bg-[var(--bg-mid)] p-6 shadow-2xl sm:mx-4 sm:max-w-md sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--button)]">
              <svg className="size-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">Submit a Review</h3>
              <p className="mt-0.5 text-xs text-[var(--text-dim)]">
                Enter the email and code from your booking.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex size-7 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)]"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-dim)] focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
              placeholder="you@example.com"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Review Code</label>
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2.5 text-sm font-bold tracking-[0.2em] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-dim)] placeholder:font-normal placeholder:tracking-normal focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
              placeholder="XXXX-XXXX"
              maxLength={9}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="w-full rounded-lg bg-[var(--text)] px-4 py-2.5 text-sm font-medium text-[var(--bg-end)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {verifying ? 'Verifying...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
