'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/language-context';

const SERVICES_DATA = [
  {
    id: 'photo',
    key: 'photo' as const,
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1600',
  },
  {
    id: 'video',
    key: 'video' as const,
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1600',
  },
  {
    id: 'graphic',
    key: 'graphic' as const,
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600',
  },
];

interface ServicesProps {
  onSelectCategory?: (category: string) => void;
}

export default function Services({ onSelectCategory }: ServicesProps) {
  const { t } = useLanguage();
  const [activeHover, setActiveHover] = useState<string | null>(null);

  return (
    <section className="relative min-h-[80vh] w-full overflow-hidden bg-[#0c0a09] py-24 md:py-32">
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        {SERVICES_DATA.map((service) => (
          <div
            key={service.id}
            className={`absolute inset-0 transition-all duration-1000 ease-out origin-center ${
              activeHover === service.id ? 'opacity-60 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <Image
              src={service.image}
              alt={service.id}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/80 to-[#0c0a09]" />
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 md:px-12">
        <p className="mb-12 text-sm font-medium tracking-[0.3em] uppercase text-amber-500/80">
          {t.services.title}
        </p>

        <ul className="flex flex-col space-y-4 md:space-y-6">
          {SERVICES_DATA.map((service) => (
            <li
              key={service.id}
              onMouseEnter={() => setActiveHover(service.id)}
              onMouseLeave={() => setActiveHover(null)}
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory(service.id === 'photo' ? 'Photography' : service.id === 'video' ? 'Videography' : 'Graphic');
                }
                const el = document.getElementById('gallery');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="group cursor-pointer border-b border-white/5 pb-4 transition-colors duration-500 hover:border-amber-500/30 md:pb-6"
            >
              <div className="flex items-end justify-between transition-transform duration-500 group-hover:translate-x-4">
                <h3 className="text-5xl font-bold tracking-tighter text-stone-600 transition-colors duration-500 group-hover:text-white sm:text-6xl md:text-7xl lg:text-9xl">
                  {t.services[service.key]}
                </h3>
                <span className="mb-2 text-sm font-medium opacity-0 transition-opacity duration-500 group-hover:text-amber-400 group-hover:opacity-100 md:mb-4 md:text-base">
                  &rarr;
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
