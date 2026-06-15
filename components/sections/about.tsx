'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NumberFlow from '@number-flow/react';
import { useLanguage } from '@/context/language-context';

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_STATS = [
  { value: 45, key: 'weddings' as const },
  { value: 28, key: 'events' as const },
  { value: 4, key: 'experience' as const },
  { value: 86, key: 'clients' as const },
];

import { fetchPublicCollection } from '@/lib/services/public-content';

// Removed hardcoded SERVICES array

// Removed CSS Marquee Component

interface AboutProps {
  initialMediaItems: any[];
  stats?: any;
  onInitialDataReady?: () => void;
}

export default function About({ initialMediaItems, stats, onInitialDataReady }: AboutProps) {
  const displayStats = stats || DEFAULT_STATS;
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [animated, setAnimated] = useState<Set<number>>(new Set());

  useEffect(() => {
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

  // Pre-fill up to 5 items for the grid if missing
  const displayItems = [...initialMediaItems];
  while (displayItems.length < 5) {
    displayItems.push({ id: `dummy-${displayItems.length}`, src: '/video-dummy.mp4', type: 'video' });
  }

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative flex min-h-[100vh] items-center overflow-hidden bg-gradient-to-b from-transparent via-[#1c1917]/80 to-transparent px-6 py-24 text-[var(--text)] md:px-12 md:py-32"
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          WebkitMaskImage: 'radial-gradient(circle at center, black 0%, transparent 80%)',
          maskImage: 'radial-gradient(circle at center, black 0%, transparent 80%)',
        }}
      >
        {/* Video Collage Grid */}
        <div className="absolute left-1/2 top-1/2 h-[150vh] w-[250vw] -translate-x-1/2 -translate-y-1/2 rotate-[-4deg] opacity-25 md:h-[150vh] md:w-[120vw] md:opacity-40">
          <div className="grid h-full w-full grid-cols-2 grid-rows-3 gap-4 md:grid-cols-4 md:grid-rows-2 md:gap-8">
            <div className="overflow-hidden rounded-2xl shadow-xl">
              {displayItems[0].type === 'video' ? <video src={displayItems[0].src} autoPlay loop muted playsInline className="size-full object-cover" /> : <img src={displayItems[0].src} className="size-full object-cover" loading="lazy" decoding="async" alt="" />}
            </div>
            <div className="overflow-hidden rounded-2xl shadow-xl md:col-span-2">
              {displayItems[1].type === 'video' ? <video src={displayItems[1].src} autoPlay loop muted playsInline className="size-full object-cover" /> : <img src={displayItems[1].src} className="size-full object-cover" loading="lazy" decoding="async" alt="" />}
            </div>
            <div className="col-span-2 overflow-hidden rounded-2xl shadow-xl md:col-span-1">
              {displayItems[2].type === 'video' ? <video src={displayItems[2].src} autoPlay loop muted playsInline className="size-full object-cover" /> : <img src={displayItems[2].src} className="size-full object-cover" loading="lazy" decoding="async" alt="" />}
            </div>
            <div className="overflow-hidden rounded-2xl shadow-xl md:col-span-2">
              {displayItems[3].type === 'video' ? <video src={displayItems[3].src} autoPlay loop muted playsInline className="size-full object-cover" /> : <img src={displayItems[3].src} className="size-full object-cover" loading="lazy" decoding="async" alt="" />}
            </div>
            <div className="overflow-hidden rounded-2xl shadow-xl md:col-span-2">
              {displayItems[4].type === 'video' ? <video src={displayItems[4].src} autoPlay loop muted playsInline className="size-full object-cover" /> : <img src={displayItems[4].src} className="size-full object-cover" loading="lazy" decoding="async" alt="" />}
            </div>
          </div>
        </div>
      </div>

      <div ref={contentRef} className="relative z-10 mx-auto w-full max-w-4xl space-y-4 md:space-y-6">
        <p className="text-sm font-medium tracking-[0.3em] uppercase text-amber-500/80">
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

        <div className="grid grid-cols-2 gap-4 pt-4 md:grid-cols-4 md:pt-6">
          {displayStats.map((stat: any, i: number) => (
            <div
              key={stat.key}
              ref={(el) => { statRefs.current[i] = el; }}
              data-idx={i}
            >
              <div className="text-3xl font-bold tracking-tighter text-amber-200/90 md:text-4xl lg:text-5xl">
                <NumberFlow
                  value={animated.has(i) ? stat.value : 0}
                  suffix="+"
                  transformTiming={{ duration: 1200, easing: 'ease-out' }}
                />
              </div>
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-dim)] md:text-xs">
                {t.about.stats[stat.key as keyof typeof t.about.stats] || stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-4 md:pt-6">
          <p className="text-sm font-medium tracking-[0.3em] uppercase text-amber-500/80">
            {t.about.servicesLabel}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
            {t.about.servicesList?.map((service, index) => (
              <span
                key={index}
                className="rounded-full border border-stone-800 bg-stone-900/50 px-5 py-2 text-sm font-medium text-[var(--text-muted)] backdrop-blur-sm transition-all duration-300 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-200"
              >
                {service}
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
