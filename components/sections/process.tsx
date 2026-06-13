'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '@/context/language-context';

gsap.registerPlugin(ScrollTrigger);

export default function Process() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!containerRef.current) return;
      
      const cards = gsap.utils.toArray('.process-card');
      const connectors = gsap.utils.toArray('.connector-progress');
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        }
      });

      tl.fromTo(
        cards,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power3.out' }
      )
      .to(
        connectors, 
        { width: '100%', duration: 0.8, stagger: 0.2, ease: 'power2.inOut' },
        '-=0.8'
      );

      // Ambient Orb Animation
      const orb = sectionRef.current?.querySelector('.ambient-orb');
      if (orb) {
        gsap.to(orb, {
          x: '20%',
          y: '10%',
          scale: 1.1,
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      }
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);

  const steps = [
    { num: '01', title: t.process.step1_title, desc: t.process.step1_desc },
    { num: '02', title: t.process.step2_title, desc: t.process.step2_desc },
    { num: '03', title: t.process.step3_title, desc: t.process.step3_desc },
  ];

  return (
    <section
      id="process"
      ref={sectionRef}
      className="relative z-10 bg-[#0c0a09] px-6 py-24 text-[var(--text)] md:px-12 md:py-32 lg:py-48"
    >
      <div className="mx-auto max-w-7xl relative">
        {/* Ambient Glowing Orb */}
        <div className="ambient-orb pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-[100px] md:h-[600px] md:w-[600px]" />

        <div className="mb-16 md:mb-24">
          <p className="mb-4 text-sm font-medium tracking-[0.3em] uppercase text-amber-500/80">
            {t.process.title}
          </p>
          <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            {t.process.subtitle}
          </h2>
        </div>

        <div ref={containerRef} className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12 lg:gap-16">
          {steps.map((step, idx) => (
            <div key={idx} className="process-card group relative rounded-3xl border border-transparent p-6 transition-all duration-500 hover:-translate-y-2 hover:border-amber-500/20 hover:bg-stone-900/30 hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.15)]">
              {/* Connector line on desktop */}
              {idx !== steps.length - 1 && (
                <div className="absolute right-0 top-16 hidden h-[2px] w-12 translate-x-6 bg-white/5 md:block lg:w-16 lg:translate-x-8">
                  <div className="connector-progress h-full w-0 bg-gradient-to-r from-amber-500/40 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                </div>
              )}
              
              <div className="mb-8 flex size-20 items-center justify-center rounded-2xl border border-white/5 bg-stone-900/50 text-3xl font-bold text-amber-500/40 transition-colors duration-500 group-hover:border-amber-500/50 group-hover:bg-amber-500/20 group-hover:text-amber-300 md:size-24 md:text-4xl">
                {step.num}
              </div>
              
              <h3 className="mb-4 text-xl font-bold tracking-tight text-[var(--text)] transition-colors duration-300 group-hover:text-white md:text-2xl">
                {step.title}
              </h3>
              
              <p className="text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
