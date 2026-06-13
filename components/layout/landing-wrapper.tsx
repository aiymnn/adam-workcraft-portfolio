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
import type { PublicAdminProfile, PublicVaultCollection, PublicReviewItem } from '@/types/content';

gsap.registerPlugin(ScrollTrigger);

const REQUIRED_DATA_SECTIONS = ['hero', 'about', 'services', 'gallery', 'feedback', 'contact'] as const;
type LandingDataSection = (typeof REQUIRED_DATA_SECTIONS)[number];

interface LandingWrapperProps {
  profile: PublicAdminProfile;
  aboutMedia: any[];
  servicesMedia: any[];
  vaults: PublicVaultCollection[];
  reviews: PublicReviewItem[];
}

export default function LandingWrapper({
  profile,
  aboutMedia,
  servicesMedia,
  vaults,
  reviews,
}: LandingWrapperProps) {
  const mainRef = useRef<HTMLDivElement>(null);
  const visitTrackedRef = useRef(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeCollection, setActiveCollection] = useState<CollectionItem | null>(null);

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
    const timer = window.setTimeout(() => setMinimumLoaderElapsed(true), 200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    // SSR already provides the profile data, so hero is instantly ready
    handleSectionDataReady('hero');
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
        <Hero profile={profile} />
        <About
          initialMediaItems={aboutMedia}
          onInitialDataReady={() => handleSectionDataReady('about')}
        />
        <Services
          initialMediaItems={servicesMedia}
          onInitialDataReady={() => handleSectionDataReady('services')}
        />
        <Process />
        <div id="gallery">
          <Gallery
            initialVaultCollections={vaults}
            onOpenCollection={handleOpenCollection}
            onInitialDataReady={() => handleSectionDataReady('gallery')}
          />
        </div>
        <div id="reviews">
          <Feedback
            initialReviews={reviews}
            onInitialDataReady={() => handleSectionDataReady('feedback')}
          />
        </div>
        <div id="connect">
          <Contact
            contactEmail={profile.email}
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
