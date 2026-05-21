'use client';

import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useLanguageTheme } from '@/context/language-theme-context';

const LINKS = [
  { key: 'home', href: '#hero' },
  { key: 'story', href: '#about' },
  { key: 'gallery', href: '#gallery' },
  { key: 'reviews', href: '#reviews' },
  { key: 'connect', href: '#connect' },
];

export default function Navbar() {
  const { language, t, setLanguage } = useLanguageTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([]);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  const cycleLanguage = () => setLanguage(language === 'en' ? 'bm' : 'en');

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen && overlayRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
        gsap.fromTo(
          linksRef.current.filter(Boolean),
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.15 },
        );
      }, overlayRef);
      return () => ctx.revert();
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      linksRef.current.forEach((el) => {
        if (el) gsap.set(el, { y: 30, opacity: 0 });
      });
    }
  }, [menuOpen]);

  const langLabel = language === 'en' ? 'EN' : 'BM';

  return (
    <>
      <nav className="fixed top-6 left-1/2 z-50 hidden -translate-x-1/2 md:block">
        <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[#1c1917]/70 px-4 py-3 backdrop-blur-md">
          {LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={(e) => handleSmoothScroll(e, link.href)}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-stone-800/60 hover:text-amber-200/80"
            >
              {t.nav[link.key as keyof typeof t.nav]}
            </a>
          ))}
          <span className="mx-2 h-4 w-px bg-stone-800" />
          <button
            onClick={cycleLanguage}
            className="rounded-full px-3 py-1.5 text-xs font-semibold tracking-wider text-amber-200/80 transition-colors hover:bg-stone-800/60"
          >
            {langLabel}
          </button>
        </div>
      </nav>

      <button
        onClick={() => setMenuOpen(true)}
        className="fixed top-6 right-6 z-50 flex size-11 items-center justify-center rounded-full border border-[var(--border)] bg-[#1c1917]/80 backdrop-blur-md md:hidden"
        aria-label="Open menu"
      >
        <svg className="size-5 text-[var(--text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {menuOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-[#0c0a09]/95 backdrop-blur-xl md:hidden"
        >
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-6 right-6 size-11 text-stone-400"
            aria-label="Close menu"
          >
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {LINKS.map((link, i) => (
            <a
              key={link.key}
              ref={(el) => { linksRef.current[i] = el; }}
              href={link.href}
              onClick={(e) => handleSmoothScroll(e, link.href)}
              className="text-3xl font-bold tracking-tight text-[var(--text)] transition-colors hover:text-amber-200/80"
            >
              {t.nav[link.key as keyof typeof t.nav]}
            </a>
          ))}

          <div className="mt-4 flex gap-6">
            <button
              onClick={cycleLanguage}
              className="rounded-full border border-[var(--border)] px-5 py-2 text-sm font-semibold tracking-wider text-amber-200/80 transition-colors hover:bg-stone-800/60"
            >
              {langLabel}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
