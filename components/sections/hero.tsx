'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useLanguage } from '@/context/language-context';
import type { PublicAdminProfile } from '@/types/content';

interface HeroProps {
  profile: PublicAdminProfile;
}

export default function Hero({ profile }: HeroProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let spinTween: gsap.core.Tween | null = null;
    let observer: IntersectionObserver | null = null;

    const ctx = gsap.context(() => {
      if (reduceMotion) {
        gsap.set([titleRef.current?.children, subtitleRef.current, ctaRef.current, imageRef.current], { clearProps: 'all', opacity: 1 });
        return;
      }

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
        spinTween = gsap.to(spinRef.current, {
          rotate: 360,
          duration: 12,
          repeat: -1,
          ease: 'none',
          force3D: true,
          paused: true,
        });

        if (containerRef.current) {
          observer = new IntersectionObserver(
            ([entry]) => {
              if (!spinTween) return;
              if (entry.isIntersecting) {
                spinTween.play();
              } else {
                spinTween.pause();
              }
            },
            { threshold: 0.05 },
          );
          observer.observe(containerRef.current);
        } else {
          spinTween.play();
        }
      }
    }, containerRef);

    return () => {
      observer?.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative z-10 min-h-screen overflow-hidden bg-black/40 bg-mesh px-6 py-20 text-[var(--text)] md:px-12 md:py-0"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[#0c0a09]/50 to-[#0c0a09]" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center gap-10 md:flex-row md:gap-12">
        {/* Image — top on mobile, right on desktop */}
        <div ref={imageRef} className="flex items-center justify-center md:order-2 md:flex-1">
          <div className="relative size-52 sm:size-64 md:size-80">
            <div ref={spinRef} className="pointer-events-none absolute -inset-4 md:-inset-5" style={{ willChange: 'transform' }}>
              <svg viewBox="0 0 120 120" className="size-full">
                <circle cx="60" cy="60" r="57" fill="none" stroke="var(--text-muted)" strokeWidth="1" pathLength="100" strokeDasharray="5 2.5 2.5 2.5" />
              </svg>
            </div>
            <Image
              src={profile.avatarUrl}
              alt={profile.name || t.hero.name}
              fill
              priority
              sizes="(max-width: 640px) 208px, (max-width: 768px) 256px, 320px"
              className="size-full rounded-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/70 via-35% to-transparent" />
          </div>
        </div>

        {/* Text content — bottom on mobile, left on desktop */}
        <div className="flex-1 text-center md:order-1 md:text-left">
          <p className="mb-3 text-xs tracking-[0.3em] uppercase text-amber-200/60 md:mb-4 md:text-sm">
            {t.hero.name}
          </p>
          <h1
            ref={titleRef}
            className="space-y-1 text-[clamp(2.5rem,10vw,6rem)] font-bold leading-[1.1] tracking-tighter md:text-7xl lg:text-9xl"
          >
            <span className="block">{t.hero.title1}</span>
            <span className="block bg-gradient-to-r from-amber-200 via-amber-100 to-stone-300 bg-clip-text text-transparent">
              {t.hero.title2}
            </span>
          </h1>
          <p
            ref={subtitleRef}
            className="mt-5 max-w-xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base md:mt-6 md:text-lg lg:text-xl"
          >
            {t.hero.subtitle}
          </p>
          <div ref={ctaRef} className="mt-7 flex flex-wrap justify-center gap-3 md:mt-10 md:justify-start">
            <a
              href="#gallery"
              className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-[var(--button-hover)] bg-[var(--button)] px-7 py-3.5 text-sm font-medium text-amber-200/90 hover:border-amber-700/50 hover:bg-[var(--button-hover)] md:px-10 md:py-4 md:text-base"
            >
              {t.hero.viewWork}
              <span className="text-amber-200/60">&rarr;</span>
            </a>
            <a
              href="#connect"
              className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-[var(--border)] px-7 py-3.5 text-sm font-medium text-[var(--text-muted)] hover:border-[var(--button-hover)] hover:text-[var(--text)] md:px-10 md:py-4 md:text-base"
            >
              {t.hero.getInTouch}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
