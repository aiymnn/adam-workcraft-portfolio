'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NumberFlow from '@number-flow/react';
import { useLanguageTheme } from '@/context/language-theme-context';

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  { value: 45, key: 'weddings' as const },
  { value: 28, key: 'events' as const },
  { value: 4, key: 'experience' as const },
  { value: 86, key: 'clients' as const },
];

const SERVICES = [
  'Wedding Photography',
  'Event Videography',
  'Corporate Shoot',
  'Short Film',
  'Image Tracing',
  'Logo Design',
  'Poster Design',
  'Graphic Design',
];

export default function About() {
  const { t } = useLanguageTheme();
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [animated, setAnimated] = useState<Set<number>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-idx'));
            setAnimated((prev) => new Set(prev).add(idx));
          }
        });
      },
      { threshold: 0.4 },
    );

    statRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!contentRef.current) return;
      gsap.fromTo(
        contentRef.current.children,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.12,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 82%',
            toggleActions: 'play none none none',
          },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="bg-[#1c1917]/60 px-6 py-24 text-[var(--text)] md:px-12 md:py-48"
    >
      <div ref={contentRef} className="mx-auto max-w-4xl space-y-6 md:space-y-8">
        <p className="text-xs tracking-[0.2em] uppercase text-amber-200/60 md:text-sm">
          {t.about.label}
        </p>
        <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
          {t.about.heading.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < t.about.heading.split('\n').length - 1 && <br />}
            </span>
          ))}
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-[var(--text-muted)] md:text-lg lg:text-xl">
          {t.about.paragraph}
        </p>

        <div className="grid grid-cols-2 gap-5 pt-4 md:grid-cols-4 md:gap-8 md:pt-8">
          {STATS.map((stat, i) => (
            <div
              key={stat.key}
              ref={(el) => { statRefs.current[i] = el; }}
              data-idx={i}
            >
              <div className="text-2xl font-bold tracking-tight text-amber-200/80 md:text-3xl lg:text-4xl">
                <NumberFlow
                  value={animated.has(i) ? stat.value : 0}
                  suffix="+"
                  transformTiming={{ duration: 800, easing: 'ease-out' }}
                />
              </div>
              <p className="mt-1 text-xs text-[var(--text-dim)] md:text-sm">
                {t.about.stats[stat.key]}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-4 md:pt-8">
          <p className="text-xs tracking-[0.2em] uppercase text-amber-200/60 md:text-sm">
            {t.about.servicesLabel}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 md:mt-4">
            {SERVICES.map((s) => (
              <span
                key={s}
                className="rounded-full border border-[var(--border)] bg-[var(--button)] px-3 py-1 text-xs text-[var(--text-muted)] transition-colors hover:border-amber-700/50 hover:text-amber-200/70 md:px-4 md:text-sm"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <p className="pt-2 text-sm text-[var(--text-dim)] md:pt-4 md:text-base">
          {t.about.location}
        </p>
      </div>
    </section>
  );
}
