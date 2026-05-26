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
