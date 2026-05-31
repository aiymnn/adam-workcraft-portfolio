'use client';

import Image from 'next/image';

interface LandingPageLoaderProps {
  isVisible: boolean;
  loadedCount: number;
  totalCount: number;
}

export default function LandingPageLoader({ isVisible, loadedCount, totalCount }: LandingPageLoaderProps) {
  if (!isVisible) {
    return null;
  }

  const progressText = `${loadedCount}/${totalCount}`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0c0a09]">
      <div className="relative flex flex-col items-center gap-5 px-6 text-center">
        <div className="relative size-24">
          <div className="absolute inset-0 rounded-full border border-amber-200/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-amber-200/20 animate-[spin_3s_linear_infinite]" />
          <div className="relative size-full overflow-hidden rounded-full border border-amber-200/40 bg-stone-900/40 p-3 shadow-[0_0_40px_rgba(217,119,6,0.15)]">
            <Image
              src="/fav.png"
              alt="Adam Workcraft"
              width={72}
              height={72}
              priority
              className="size-full object-contain animate-pulse"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm tracking-[0.22em] uppercase text-amber-200/75">Preparing Experience</p>
          <p className="text-xs text-stone-400">Loading data {progressText}</p>
        </div>
      </div>
    </div>
  );
}