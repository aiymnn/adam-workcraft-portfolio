'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const INTERACTIVE_SELECTOR = 'a, button, input, textarea, [data-cursor]';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    const xTo = gsap.quickTo(cursor, 'x', { ease: 'power3.out', duration: 0.1 });
    const yTo = gsap.quickTo(cursor, 'y', { ease: 'power3.out', duration: 0.1 });
    const xToF = gsap.quickTo(follower, 'x', { ease: 'power3.out', duration: 0.3 });
    const yToF = gsap.quickTo(follower, 'y', { ease: 'power3.out', duration: 0.3 });

    const onMouse = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      xToF(e.clientX);
      yToF(e.clientY);
    };

    const onEnter = () => {
      gsap.to(cursor, { scale: 1.8, duration: 0.2, ease: 'power2.out' });
      gsap.to(follower, { scale: 2.5, opacity: 0.3, duration: 0.2, ease: 'power2.out' });
    };

    const onLeave = () => {
      gsap.to(cursor, { scale: 1, duration: 0.2, ease: 'power2.out' });
      gsap.to(follower, { scale: 1, opacity: 0.15, duration: 0.2, ease: 'power2.out' });
    };

    window.addEventListener('mousemove', onMouse, { passive: true });

    const attachEvents = () => {
      document.querySelectorAll(INTERACTIVE_SELECTOR).forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        el.addEventListener('mouseenter', onEnter, { passive: true });
        el.addEventListener('mouseleave', onLeave, { passive: true });
      });
    };
    attachEvents();

    const observer = new MutationObserver(attachEvents);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMouse);
      document.querySelectorAll(INTERACTIVE_SELECTOR).forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
      observer.disconnect();
    };
  }, []);

  return (
    <div className="hidden lg:block">
      <div
        ref={cursorRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] size-3 rounded-full bg-amber-200 will-change-transform"
      />
      <div
        ref={followerRef}
        className="pointer-events-none fixed left-0 top-0 z-[9998] size-8 rounded-full border border-amber-200/30 opacity-15 will-change-transform"
      />
    </div>
  );
}
