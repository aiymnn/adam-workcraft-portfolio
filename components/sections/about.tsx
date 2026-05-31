'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NumberFlow from '@number-flow/react';
import { useLanguage } from '@/context/language-context';
import { fetchPublicStoryLoopImages } from '@/lib/services/public-content';
import { DEFAULT_STORY_LOOP_LOGOS, toRenderableStoryLoopLogos } from '@/lib/story-loop-logos';

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

const STRIP_COLUMNS = 6;
const MIN_CYCLE_ROWS = 5;
const MIN_BASE_ITEMS = 30;
const MIN_RENDER_ROWS = 24;
const ROW_LAYOUTS: { scales: [number, number, number, number, number, number]; opacities: [number, number, number, number, number, number] }[] = [
  { scales: [0.25, 0.4, 1, 0.9, 0.35, 0.15], opacities: [0.02, 0.06, 0.3, 0.25, 0.05, 0.01] },
  { scales: [0.9, 0.75, 0.55, 1, 0.4, 0.2], opacities: [0.25, 0.18, 0.08, 0.3, 0.04, 0.02] },
  { scales: [0.3, 0.6, 1, 0.7, 0.5, 0.25], opacities: [0.03, 0.1, 0.3, 0.15, 0.07, 0.02] },
  { scales: [1, 0.8, 0.6, 0.45, 0.3, 0.1], opacities: [0.3, 0.2, 0.12, 0.06, 0.03, 0.01] },
];

interface StripTool {
  id: string;
  name: string;
  src: string;
  scale: number;
  opacity: number;
  frameSize: number;
}

interface StripBuildResult {
  rows: StripTool[][];
  cycleRows: number;
}

function hashText(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seedValue: number): () => number {
  let seed = seedValue || 123456789;
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chunkRows(items: StripTool[], size: number): StripTool[][] {
  const rows: StripTool[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildStripContent(logos: Array<{ name: string; src: string }>): StripBuildResult {
  if (logos.length === 0) {
    return { rows: [], cycleRows: 0 };
  }

  const seedInput = logos.map((logo) => `${logo.name}|${logo.src}`).join('~');
  const random = createSeededRandom(hashText(seedInput));

  const baseItemCount = Math.max(MIN_BASE_ITEMS, logos.length < MIN_BASE_ITEMS ? logos.length * 4 : logos.length);
  const seededItems: StripTool[] = [];
  const rowLayoutOffset = Math.floor(random() * ROW_LAYOUTS.length);

  for (let i = 0; i < baseItemCount; i += 1) {
    const source = logos[i % logos.length];
    const rowIndex = Math.floor(i / STRIP_COLUMNS);
    const colIndex = i % STRIP_COLUMNS;
    const layout = ROW_LAYOUTS[(rowIndex + rowLayoutOffset) % ROW_LAYOUTS.length];
    const scale = clamp(layout.scales[colIndex] + (random() - 0.5) * 0.16, 0.1, 1.05);
    const opacity = clamp(layout.opacities[colIndex] + (random() - 0.5) * 0.05, 0.01, 0.3);
    const frameSize = Math.round(26 + scale * 90);

    seededItems.push({
      id: `${source.name}-${i}`,
      name: source.name,
      src: source.src,
      scale,
      opacity,
      frameSize,
    });
  }

  for (let i = seededItems.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [seededItems[i], seededItems[j]] = [seededItems[j], seededItems[i]];
  }

  let baseRows = chunkRows(seededItems, STRIP_COLUMNS).filter((row) => row.length === STRIP_COLUMNS);

  if (baseRows.length === 0) {
    return { rows: [], cycleRows: 0 };
  }

  while (baseRows.length < MIN_CYCLE_ROWS) {
    baseRows = [...baseRows, ...baseRows].slice(0, MIN_CYCLE_ROWS);
  }

  const cycleRows = baseRows.length;
  const renderSets = Math.max(4, Math.ceil(MIN_RENDER_ROWS / cycleRows));
  const rows = Array.from({ length: renderSets }, () => baseRows).flat();

  return { rows, cycleRows };
}

function ToolStrip({ stripRef, content }: { stripRef: React.RefObject<HTMLDivElement | null>; content: StripTool[][] }) {
  return (
    <div
      ref={stripRef}
      className="flex flex-col gap-16 md:gap-20"
      style={{ willChange: 'transform' }}
    >
      {content.map((row, ri) => (
        <div
          key={ri}
          className="flex justify-center gap-12 md:gap-16"
          style={{ transform: `translateX(${(ri % 2 === 0 ? 1 : -1) * 8}px)` }}
        >
          {row.map((tool, ci) => (
            <div
              key={tool.id + ri + ci}
              className="relative shrink-0 overflow-hidden rounded-md md:rounded-lg"
              style={{
                width: `${tool.frameSize}px`,
                height: `${tool.frameSize}px`,
                opacity: tool.opacity,
              }}
            >
              <Image
                src={tool.src}
                alt={tool.name}
                fill
                className="h-full w-full object-cover"
                loading="lazy"
                quality={55}
                sizes="(max-width: 768px) 64px, 96px"
              />
            </div>
          ))}
        </div>
      ))}
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
  const stripRef = useRef<HTMLDivElement>(null);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [animated, setAnimated] = useState<Set<number>>(new Set());
  const [tools, setTools] = useState<Array<{ name: string; src: string }>>(DEFAULT_STORY_LOOP_LOGOS);

  useEffect(() => {
    let active = true;

    const loadStoryLoopLogos = async () => {
      try {
        const logos = await fetchPublicStoryLoopImages();
        if (!active) return;
        setTools(toRenderableStoryLoopLogos(logos));
      } catch {
      } finally {
        if (active) {
          onInitialDataReady?.();
        }
      }
    };

    void loadStoryLoopLogos();

    return () => {
      active = false;
    };
  }, [onInitialDataReady]);

  const fallbackStripContent = useMemo(() => buildStripContent(DEFAULT_STORY_LOOP_LOGOS), []);
  const dynamicStripContent = useMemo(() => buildStripContent(tools), [tools]);

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
    const source = dynamicStripContent.rows.length > 0 ? dynamicStripContent : fallbackStripContent;
    if (source.cycleRows <= 0 || children.length <= source.cycleRows) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      gsap.set(strip, { y: 0 });
      return;
    }

    const h =
      (children[source.cycleRows] as HTMLElement).offsetTop - (children[0] as HTMLElement).offsetTop;
    const duration = Math.max(12, source.cycleRows * 2.25);
    let tween: gsap.core.Tween | null = null;
    let observer: IntersectionObserver | null = null;
    const ctx = gsap.context(() => {
      gsap.set(strip, { force3D: true });
      tween = gsap.to(strip, {
        y: -h,
        duration,
        repeat: -1,
        ease: 'none',
        force3D: true,
        paused: true,
      });

      if (sectionRef.current && tween) {
        observer = new IntersectionObserver(
          ([entry]) => {
            if (!tween) return;
            if (entry.isIntersecting) {
              tween.play();
            } else {
              tween.pause();
            }
          },
          { threshold: 0.05 },
        );
        observer.observe(sectionRef.current);
      } else {
        tween?.play();
      }
    });

    return () => {
      observer?.disconnect();
      ctx.revert();
    };
  }, [dynamicStripContent, fallbackStripContent]);

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
          <ToolStrip stripRef={stripRef} content={dynamicStripContent.rows.length > 0 ? dynamicStripContent.rows : fallbackStripContent.rows} />
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
