'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '@/context/language-context';
import { fetchPublicCollection } from '@/lib/services/public-content';

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_SERVICES_DATA = [
  {
    id: 'photo',
    key: 'photo' as const,
    desc: 'Preserving your authentic memories in stunning detail. From intimate portraits to grand celebrations, every shot tells a story.',
    images: ['/design1.jpg', '/design2.jpg', '/design3.jpg'],
    isVideo: false,
  },
  {
    id: 'video',
    key: 'video' as const,
    desc: 'Capturing timeless moments with cinematic precision. Dynamic, emotional, and beautifully crafted films of your unique journey.',
    videoSrc: '/dummy-event1.mp4',
    isVideo: true,
  },
];

interface ServicesProps {
  initialMediaItems: any[];
  onSelectCategory?: (category: string) => void;
  onInitialDataReady?: () => void;
}

export default function Services({ initialMediaItems, onSelectCategory, onInitialDataReady }: ServicesProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLElement>(null);
  const mobileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  const servicesData = useMemo(() => {
    const images = initialMediaItems.filter((i: any) => i.type === 'image').map((i: any) => i.src);
    const videos = initialMediaItems.filter((i: any) => i.type === 'video').map((i: any) => i.src);
    
    return [
      {
        ...DEFAULT_SERVICES_DATA[0],
        images: images.length > 0 ? images : DEFAULT_SERVICES_DATA[0].images,
      },
      {
        ...DEFAULT_SERVICES_DATA[1],
        videoSrc: videos.length > 0 ? videos[0] : DEFAULT_SERVICES_DATA[1].videoSrc,
      }
    ];
  }, [initialMediaItems]);

  useEffect(() => {
    onInitialDataReady?.();
  }, [onInitialDataReady]);

  // Carousel logic
  useEffect(() => {
    const photoService = servicesData.find(s => s.id === 'photo');
    if (!photoService || !photoService.images?.length) return;

    const interval = setInterval(() => {
      setPhotoIndex(prev => (prev + 1) % photoService.images!.length);
    }, 4000); // 4 seconds per image
    return () => clearInterval(interval);
  }, [servicesData]);

  // Mobile scroll auto-illuminate effect
  useEffect(() => {
    if (window.innerWidth >= 768) return;

    const ctx = gsap.context(() => {
      mobileRefs.current.forEach((el) => {
        if (!el) return;
        const container = el.querySelector('.bg-media-container');
        if (!container) return;

        ScrollTrigger.create({
          trigger: el,
          start: 'top 60%',
          end: 'bottom 40%',
          toggleClass: { targets: container as Element, className: 'mobile-active' },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative w-full bg-[#0c0a09]">
      <style dangerouslySetInnerHTML={{
        __html: `
        .bg-media-container.mobile-active .is-active,
        .bg-media-container.mobile-active video.bg-media-item {
          opacity: 0.6 !important;
          transform: scale(1) !important;
        }
      `}} />

      {/* Header section before the split screens */}
      <div className="absolute top-0 left-0 z-20 w-full p-6 md:p-12 pointer-events-none">
        <p className="text-sm font-medium tracking-[0.3em] uppercase text-amber-500/80 drop-shadow-md">
          {t.services.title}
        </p>
      </div>

      <div className="flex h-[100vh] w-full flex-col md:flex-row">
        {servicesData.map((service, index) => (
          <div
            key={service.id}
            ref={(el) => { mobileRefs.current[index] = el; }}
            className={`group relative flex flex-1 cursor-pointer flex-col justify-end overflow-hidden border-stone-800 transition-[flex] duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] md:hover:flex-[1.4] ${index === 0 ? 'border-b md:border-b-0 md:border-r' : ''
              }`}
            onClick={() => {
              if (onSelectCategory) {
                onSelectCategory(service.id === 'photo' ? 'Photography' : 'Videography');
              }
              const el = document.getElementById('gallery');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            {/* Background Media */}
            <div className="bg-media-container absolute inset-0 z-0 bg-black">
              {service.isVideo ? (
                <video
                  src={service.videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="bg-media-item absolute inset-0 w-full h-full object-cover opacity-30 md:opacity-0 transition-all duration-1000 ease-out md:scale-105 md:group-hover:scale-100 md:group-hover:opacity-60"
                />
              ) : (
                service.images?.map((img, i) => (
                  <Image
                    key={img}
                    src={img}
                    alt={`${service.id}-${i}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={`bg-media-item object-cover transition-all duration-1000 ease-out md:scale-105 md:group-hover:scale-100 ${i === photoIndex
                        ? 'is-active z-10 opacity-30 md:opacity-0 md:group-hover:opacity-60'
                        : 'z-0 opacity-0'
                      }`}
                    priority={i === 0}
                  />
                ))
              )}
              <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/60 to-[#0c0a09]/20 opacity-90 transition-opacity duration-700 md:opacity-100 md:group-hover:opacity-80" />
            </div>

            {/* Content Content */}
            <div className="relative z-30 p-8 md:p-12 lg:p-16 transition-transform duration-700 ease-out md:translate-y-8 md:group-hover:translate-y-0">
              <div className="flex items-end justify-between md:block">
                <h3 className="text-5xl font-bold tracking-tighter text-stone-200 transition-colors duration-500 md:text-stone-600 md:group-hover:text-white sm:text-6xl md:text-7xl lg:text-8xl">
                  {t.services[service.key]}
                </h3>
                {/* Mobile-only arrow */}
                <span className="mb-2 text-xl text-amber-500 md:hidden">&rarr;</span>
              </div>

              <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-400 opacity-100 transition-opacity duration-700 delay-100 md:opacity-0 md:group-hover:opacity-100">
                {service.desc}
              </p>

              <div className="mt-8 hidden overflow-hidden md:block">
                <span className="inline-block transform text-xs font-bold uppercase tracking-[0.2em] text-amber-500 transition-transform duration-700 delay-200 md:translate-y-full md:group-hover:translate-y-0">
                  Explore Work &rarr;
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
