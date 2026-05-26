'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NumberFlow from '@number-flow/react';
import { useLanguage } from '@/context/language-context';

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

const TOOLS = [
  { name: 'Photoshop', src: '/photoshop-logo.png' },
  { name: 'Lightroom', src: '/photoshop-logo.png' },
  { name: 'Premiere Pro', src: '/photoshop-logo.png' },
  { name: 'After Effects', src: '/photoshop-logo.png' },
  { name: 'Illustrator', src: '/photoshop-logo.png' },
  { name: 'DaVinci Resolve', src: '/photoshop-logo.png' },
  { name: 'Final Cut Pro', src: '/photoshop-logo.png' },
  { name: 'Canva', src: '/photoshop-logo.png' },
  { name: 'CapCut', src: '/photoshop-logo.png' },
  { name: 'Blender', src: '/photoshop-logo.png' },
  { name: 'Figma', src: '/photoshop-logo.png' },
  { name: 'Audition', src: '/photoshop-logo.png' },
  { name: 'Capture One', src: '/photoshop-logo.png' },
  { name: 'Pro Tools', src: '/photoshop-logo.png' },
  { name: 'Logic Pro', src: '/photoshop-logo.png' },
  { name: 'Unity', src: '/photoshop-logo.png' },
  { name: 'Maya', src: '/photoshop-logo.png' },
  { name: 'Cinema 4D', src: '/photoshop-logo.png' },
  { name: 'CorelDRAW', src: '/photoshop-logo.png' },
  { name: 'Sketch', src: '/photoshop-logo.png' },
  { name: 'Affinity', src: '/photoshop-logo.png' },
  { name: 'Luminar', src: '/photoshop-logo.png' },
  { name: 'Photomatix', src: '/photoshop-logo.png' },
  { name: 'Houdini', src: '/photoshop-logo.png' },
];

const ROW_LAYOUTS: { scales: [number, number, number, number, number, number]; opacities: [number, number, number, number, number, number] }[] = [
  { scales: [0.25, 0.4, 1, 0.9, 0.35, 0.15], opacities: [0.02, 0.06, 0.3, 0.25, 0.05, 0.01] },
  { scales: [0.9, 0.75, 0.55, 1, 0.4, 0.2], opacities: [0.25, 0.18, 0.08, 0.3, 0.04, 0.02] },
  { scales: [0.3, 0.6, 1, 0.7, 0.5, 0.25], opacities: [0.03, 0.1, 0.3, 0.15, 0.07, 0.02] },
  { scales: [1, 0.8, 0.6, 0.45, 0.3, 0.1], opacities: [0.3, 0.2, 0.12, 0.06, 0.03, 0.01] },
];

const rows: { name: string; src: string }[][] = [];
for (let i = 0; i < TOOLS.length; i += 6) {
  rows.push(TOOLS.slice(i, i + 6));
}
const STRIP_CONTENT = [...rows, ...rows, ...rows, ...rows, ...rows, ...rows];

function ToolStrip({ stripRef }: { stripRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={stripRef}
      className="flex flex-col gap-16 md:gap-20"
    >
      {STRIP_CONTENT.map((row, ri) => {
        const cfg = ROW_LAYOUTS[ri % ROW_LAYOUTS.length];
        return (
          <div key={ri} className="flex justify-center gap-12 md:gap-16">
            {row.map((tool, ci) => (
              <img
                key={tool.name + ri + ci}
                src={tool.src}
                alt={tool.name}
                className="size-16 md:size-20"
                style={{ transform: `scale(${cfg.scales[ci]})`, opacity: cfg.opacities[ci] }}
                loading="lazy"
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function About() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!stripRef.current) return;
    const strip = stripRef.current;
    const children = strip.children;
    if (children.length < 5) return;
    const h =
      (children[4] as HTMLElement).offsetTop - (children[0] as HTMLElement).offsetTop;
    const ctx = gsap.context(() => {
      gsap.to(strip, {
        y: -h,
        duration: 10,
        repeat: -1,
        ease: 'none',
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative overflow-hidden bg-[#1c1917]/60 px-6 py-24 text-[var(--text)] md:px-12 md:py-48"
    >
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
        }}
      >
        <div style={{ transform: 'translateX(40%) rotate(30deg)' }}>
          <ToolStrip stripRef={stripRef} />
        </div>
      </div>

      <div ref={contentRef} className="relative z-10 mx-auto max-w-4xl space-y-6 md:space-y-8">
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
