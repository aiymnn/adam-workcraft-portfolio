'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '@/components/layout/navbar';
import Hero from '@/components/sections/hero';
import About from '@/components/sections/about';
import Process from '@/components/sections/process';
import Services from '@/components/sections/services';
import Gallery from '@/components/sections/gallery';
import type { CollectionItem } from '@/components/sections/gallery';
import LightboxModal from '@/components/ui/lightbox-modal';
import Feedback from '@/components/sections/feedback';
import Contact from '@/components/sections/contact';
import LandingPageLoader from '@/components/ui/landing-page-loader';
import { DEFAULT_PROFILE } from '@/lib/constants';
import { fetchPublicAdminProfile } from '@/lib/services/public-content';
import type { PublicAdminProfile } from '@/types/content';

gsap.registerPlugin(ScrollTrigger);

const REQUIRED_DATA_SECTIONS = ['hero', 'about', 'gallery', 'feedback', 'contact'] as const;
type LandingDataSection = (typeof REQUIRED_DATA_SECTIONS)[number];

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);
  const visitTrackedRef = useRef(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeCollection, setActiveCollection] = useState<CollectionItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [publicProfile, setPublicProfile] = useState<PublicAdminProfile>(DEFAULT_PROFILE);
  const [pendingDataSections, setPendingDataSections] = useState<Set<LandingDataSection>>(
    () => new Set(REQUIRED_DATA_SECTIONS),
  );
  const [minimumLoaderElapsed, setMinimumLoaderElapsed] = useState(false);

  const handleOpenCollection = useCallback((collection: CollectionItem) => {
    setActiveCollection(collection);
    setLightboxOpen(true);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const handleSectionDataReady = useCallback((section: LandingDataSection) => {
    setPendingDataSections((prev) => {
      if (!prev.has(section)) return prev;
      const next = new Set(prev);
      next.delete(section);
      return next;
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumLoaderElapsed(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const profile = await fetchPublicAdminProfile();
        if (!active) return;
        setPublicProfile(profile);
      } finally {
        if (active) {
          handleSectionDataReady('hero');
        }
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, [handleSectionDataReady]);

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


  const loadedCount = REQUIRED_DATA_SECTIONS.length - pendingDataSections.size;
  const isLandingLoading = !minimumLoaderElapsed || pendingDataSections.size > 0;

  return (
    <>
      <LandingPageLoader
        isVisible={isLandingLoading}
        loadedCount={loadedCount}
        totalCount={REQUIRED_DATA_SECTIONS.length}
      />
      <main ref={mainRef}>
        <Navbar />
        <Hero profile={publicProfile} />
        <About onInitialDataReady={() => handleSectionDataReady('about')} />
        <Services onSelectCategory={setActiveCategory} />
        <Process />
        <div id="gallery">
          <Gallery
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            onOpenCollection={handleOpenCollection}
            onInitialDataReady={() => handleSectionDataReady('gallery')}
          />
        </div>
        <div id="reviews">
          <Feedback onInitialDataReady={() => handleSectionDataReady('feedback')} />
        </div>
        <div id="connect">
          <Contact
            contactEmail={publicProfile.email}
            onInitialDataReady={() => handleSectionDataReady('contact')}
          />
        </div>
        <LightboxModal
          isOpen={lightboxOpen}
          collection={activeCollection}
          onClose={handleCloseLightbox}
        />
      </main>
    </>
  );
}
