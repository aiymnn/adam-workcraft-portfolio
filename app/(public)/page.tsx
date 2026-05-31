'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '@/components/layout/navbar';
import Hero from '@/components/sections/hero';
import About from '@/components/sections/about';
import Gallery from '@/components/sections/gallery';
import type { CollectionItem } from '@/components/sections/gallery';
import LightboxModal from '@/components/ui/lightbox-modal';
import Feedback from '@/components/sections/feedback';
import Contact from '@/components/sections/contact';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);
  const visitTrackedRef = useRef(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeCollection, setActiveCollection] = useState<CollectionItem | null>(null);

  const handleOpenCollection = useCallback((collection: CollectionItem) => {
    setActiveCollection(collection);
    setLightboxOpen(true);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  useEffect(() => {
    if (visitTrackedRef.current) return;

    const path = window.location.pathname || '/';
    const key = `aw_visit_tracked:${path}`;
    if (window.sessionStorage.getItem(key) === '1') {
      visitTrackedRef.current = true;
      return;
    }

    const payload = JSON.stringify({ path });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/public/analytics/visit', blob);
    } else {
      void fetch('/api/public/analytics/visit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        keepalive: true,
      });
    }

    window.sessionStorage.setItem(key, '1');
    visitTrackedRef.current = true;
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const sections = document.querySelectorAll('section[id]');
      sections.forEach((section) => {
        (section as HTMLElement).style.willChange = 'opacity, transform';
        gsap.fromTo(
          section,
          { opacity: 0.3 },
          {
            opacity: 1,
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              end: 'bottom 20%',
              scrub: true,
            },
          },
        );
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={mainRef}>
      <Navbar />
      <Hero />
      <About />
      <div id="gallery">
        <Gallery onOpenCollection={handleOpenCollection} />
      </div>
      <div id="reviews">
        <Feedback />
      </div>
      <div id="connect">
        <Contact />
      </div>
      <LightboxModal
        isOpen={lightboxOpen}
        collection={activeCollection}
        onClose={handleCloseLightbox}
      />
    </main>
  );
}
