'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useLanguageTheme } from '@/context/language-theme-context';

export default function Hero() {
  const { t } = useLanguageTheme();
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      const titleChildren = titleRef.current?.children;
      if (titleChildren) {
        tl.fromTo(
          Array.from(titleChildren),
          { y: 80, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, stagger: 0.2 },
        );
      }
      tl.fromTo(
        subtitleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        '-=0.5',
      ).fromTo(
        ctaRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        '-=0.3',
      ).fromTo(
        imageRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2 },
        '-=1',
      );

      if (spinRef.current) {
        gsap.to(spinRef.current, { rotate: 360, duration: 12, repeat: -1, ease: 'none' });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative z-10 min-h-screen overflow-hidden bg-black/40 px-6 py-24 text-[var(--text)] md:px-12 md:py-0"
    >
      <div className="absolute inset-0 -z-10 h-[150%] w-[150%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/40 via-stone-950/80 to-transparent blur-3xl" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col-reverse items-center gap-8 md:gap-12 md:flex-row">
        <div className="flex-1">
          <p className="mb-4 text-xs tracking-[0.3em] uppercase text-amber-200/60 md:text-sm">
            {t.hero.name}
          </p>
          <h1
            ref={titleRef}
            className="space-y-2 text-4xl font-bold leading-tight tracking-tighter sm:text-5xl md:text-7xl lg:text-9xl"
          >
            <span className="block">{t.hero.title1}</span>
            <span className="block bg-gradient-to-r from-amber-200 via-amber-100 to-stone-300 bg-clip-text text-transparent">
              {t.hero.title2}
            </span>
          </h1>
          <p
            ref={subtitleRef}
            className="mt-6 max-w-xl text-base leading-relaxed text-[var(--text-muted)] md:text-lg lg:text-xl"
          >
            {t.hero.subtitle}
          </p>
          <div ref={ctaRef} className="mt-8 flex flex-wrap gap-4 md:mt-10">
            <a
              href="#gallery"
              className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-[var(--button-hover)] bg-[var(--button)] px-8 py-3 text-sm font-medium text-amber-200/90 hover:border-amber-700/50 hover:bg-[var(--button-hover)] md:px-10 md:py-4 md:text-base"
            >
              {t.hero.viewWork}
              <span className="text-amber-200/60">&rarr;</span>
            </a>
            <a
              href="#connect"
              className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-[var(--border)] px-8 py-3 text-sm font-medium text-[var(--text-muted)] hover:border-[var(--button-hover)] hover:text-[var(--text)] md:px-10 md:py-4 md:text-base"
            >
              {t.hero.getInTouch}
            </a>
          </div>
        </div>

        <div ref={imageRef} className="flex flex-1 items-center justify-center">
          <div className="relative size-56 md:size-72">
            <div ref={spinRef} className="pointer-events-none absolute -inset-5 max-md:-inset-3" style={{ willChange: 'transform' }}>
              <svg viewBox="0 0 120 120" className="size-full">
                <circle cx="60" cy="60" r="57" fill="none" stroke="var(--text-muted)" strokeWidth="1" pathLength="100" strokeDasharray="5 2.5 2.5 2.5" />
              </svg>
            </div>
            <img
              src="/person-2.png"
              alt={t.hero.name}
              className="size-full rounded-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_50%_20%,transparent_50%,#0c0a09_95%)]" />
            <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-t from-[#0c0a09]/80 via-[#0c0a09]/20 to-transparent/0" />
          </div>
        </div>
      </div>
    </section>
  );
}
