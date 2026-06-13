'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NumberFlow from '@number-flow/react';
import { useLanguage } from '@/context/language-context';
import { DEFAULT_STORY_LOOP_LOGOS } from '@/lib/story-loop-logos';

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

// Simple CSS Marquee Component
function ToolStrip() {
  // Duplicate logos a few times for seamless marquee
  const items = [...DEFAULT_STORY_LOOP_LOGOS, ...DEFAULT_STORY_LOOP_LOGOS, ...DEFAULT_STORY_LOOP_LOGOS, ...DEFAULT_STORY_LOOP_LOGOS];

  const SIZES = [
    'size-16 md:size-20',
    'size-20 md:size-24',
    'size-24 md:size-28',
    'size-28 md:size-32',
  ];

  const COLUMNS = [
    { animation: 'animate-[marquee-reverse_45s_linear_infinite]', extraClass: 'opacity-20 hidden lg:flex', sizesOffset: 0 },
    { animation: 'animate-[marquee_40s_linear_infinite]', extraClass: 'opacity-50 hidden md:flex', sizesOffset: 1 },
    { animation: 'animate-[marquee-reverse_50s_linear_infinite]', extraClass: 'opacity-100', sizesOffset: 2 },
    { animation: 'animate-[marquee_45s_linear_infinite]', extraClass: 'opacity-100', sizesOffset: 3 },
    { animation: 'animate-[marquee-reverse_40s_linear_infinite]', extraClass: 'opacity-100', sizesOffset: 1 },
    { animation: 'animate-[marquee_50s_linear_infinite]', extraClass: 'opacity-50 hidden md:flex', sizesOffset: 2 },
    { animation: 'animate-[marquee-reverse_45s_linear_infinite]', extraClass: 'opacity-20 hidden lg:flex', sizesOffset: 0 },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-40">
      <div className="flex h-[200vh] w-[150vw] flex-row justify-center gap-6 md:gap-10" style={{ transform: 'rotate(30deg) scale(1.1)' }}>
        {COLUMNS.map((col, colIdx) => (
          <div key={colIdx} className={`flex flex-col gap-6 md:gap-10 ${col.animation} ${col.extraClass}`}>
            {items.map((item, i) => {
              // Semi-random size based on column and item index
              const sizeClass = SIZES[(i * 3 + col.sizesOffset * 5) % SIZES.length];
              return (
                <div key={`col${colIdx}-${item.name}-${i}`} className={`relative shrink-0 overflow-hidden rounded-xl bg-stone-800/50 p-4 backdrop-blur-sm ${sizeClass}`}>
                  <Image
                    src={item.src}
                    alt={item.name}
                    fill
                    className="object-contain p-4 opacity-50 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0"
                    sizes="128px"
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

interface AboutProps {
  onInitialDataReady?: () => void;
}

export default function About({ onInitialDataReady }: AboutProps) {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [animated, setAnimated] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Instantly ready since we removed async fetching
    onInitialDataReady?.();
  }, [onInitialDataReady]);

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
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 85%',
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
      className="relative overflow-hidden bg-gradient-to-b from-transparent via-[#1c1917]/80 to-transparent px-6 py-24 text-[var(--text)] md:px-12 md:py-48"
    >
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{
          WebkitMaskImage: 'radial-gradient(circle at center, black 0%, transparent 70%)',
          maskImage: 'radial-gradient(circle at center, black 0%, transparent 70%)',
        }}
      >
        <ToolStrip />
      </div>

      <div ref={contentRef} className="relative z-10 mx-auto max-w-4xl space-y-8 md:space-y-12">
        <p className="text-sm font-medium tracking-[0.3em] uppercase text-amber-500/80">
          {t.about.label}
        </p>
        <h2 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          {t.about.heading.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < t.about.heading.split('\n').length - 1 && <br />}
            </span>
          ))}
        </h2>
        <p className="max-w-2xl text-lg leading-relaxed text-[var(--text-muted)] md:text-xl lg:text-2xl">
          {t.about.paragraph}
        </p>

        <div className="grid grid-cols-2 gap-8 pt-8 md:grid-cols-4 md:pt-12">
          {STATS.map((stat, i) => (
            <div
              key={stat.key}
              ref={(el) => { statRefs.current[i] = el; }}
              data-idx={i}
            >
              <div className="text-4xl font-bold tracking-tighter text-amber-200/90 md:text-5xl lg:text-6xl">
                <NumberFlow
                  value={animated.has(i) ? stat.value : 0}
                  suffix="+"
                  transformTiming={{ duration: 1200, easing: 'ease-out' }}
                />
              </div>
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)] md:text-sm">
                {t.about.stats[stat.key]}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-8 md:pt-16">
          <p className="text-sm font-medium tracking-[0.3em] uppercase text-amber-500/80">
            {t.about.servicesLabel}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
            {SERVICES.map((s) => (
              <span
                key={s}
                className="rounded-full border border-stone-800 bg-stone-900/50 px-5 py-2 text-sm font-medium text-[var(--text-muted)] backdrop-blur-sm transition-all duration-300 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-200"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <p className="pt-6 text-sm font-medium text-[var(--text-dim)] md:pt-8 md:text-base">
          {t.about.location}
        </p>
      </div>
    </section>
  );
}
