'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import MagneticButton from '@/components/ui/magnetic-button';
import { useLanguage } from '@/context/language-context';
import { fetchPublicSocialLinks } from '@/lib/services/public-content';
import type { PublicSocialLinks } from '@/types/content';

export default function Contact() {
  const { t } = useLanguage();
  const [socialLinks, setSocialLinks] = useState<PublicSocialLinks>({ x: '', instagram: '', threads: '', tiktok: '', whatsapp: '' });
  const hasAnySocialLink = Object.values(socialLinks).some((value) => value.trim().length > 0);

  useEffect(() => {
    let active = true;

    const loadLinks = async () => {
      const links = await fetchPublicSocialLinks();
      if (!active) return;
      setSocialLinks(links);
    };

    void loadLinks();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const getSocialAnchorProps = (url: string) => {
    const normalized = url.trim();
    if (!normalized) {
      return {
        href: undefined,
        target: undefined,
        rel: undefined,
        className: 'pointer-events-none opacity-40',
      };
    }

    return {
      href: normalized,
      target: '_blank' as const,
      rel: 'noopener noreferrer',
      className: '',
    };
  };

  return (
    <section
      id="connect"
      className="bg-black/40 px-6 py-16 text-[var(--text)] md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 md:gap-16 lg:grid-cols-2">
          <div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {t.contact.heading1}
              <br />
              {t.contact.heading2}
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--text-muted)] md:mt-6 md:text-base">
              {t.contact.description}
            </p>

            <div className="mt-8 space-y-3 text-sm text-[var(--text-dim)] md:mt-10 md:space-y-4">
              <p className="text-amber-200/70">{t.contact.email}</p>
              <p>{t.contact.location}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            <div>
              <label htmlFor="name" className="sr-only">
                {t.contact.namePlaceholder}
              </label>
              <input
                id="name"
                type="text"
                placeholder={t.contact.namePlaceholder}
                className="w-full border-b border-[var(--border)] bg-transparent py-3 min-h-[44px] text-sm text-[var(--text)] placeholder-stone-600 outline-none transition-colors focus:border-amber-700/50"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                {t.contact.emailPlaceholder}
              </label>
              <input
                id="email"
                type="email"
                placeholder={t.contact.emailPlaceholder}
                className="w-full border-b border-[var(--border)] bg-transparent py-3 min-h-[44px] text-sm text-[var(--text)] placeholder-stone-600 outline-none transition-colors focus:border-amber-700/50"
              />
            </div>
            <div>
              <label htmlFor="message" className="sr-only">
                {t.contact.messagePlaceholder}
              </label>
              <textarea
                id="message"
                rows={4}
                placeholder={t.contact.messagePlaceholder}
                className="w-full resize-none border-b border-[var(--border)] bg-transparent py-3 text-sm text-[var(--text)] placeholder-stone-600 outline-none transition-colors focus:border-amber-700/50"
              />
            </div>
            <MagneticButton
              type="submit"
              className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-[var(--button-hover)] bg-[var(--button)] px-8 py-3 text-sm font-medium text-amber-200/90 transition-colors hover:border-amber-700/50 hover:bg-[var(--button-hover)] md:px-10 md:py-4 md:text-base"
            >
              {t.contact.sendMessage}
              <span className="text-amber-200/60">&rarr;</span>
            </MagneticButton>
          </form>
        </div>

        <div className="mt-10 flex items-center justify-center md:mt-14">
          <Link
            href="/submit-review"
            className="flex items-center gap-1.5 text-xs text-[var(--text-dim)] transition-colors hover:text-amber-200/70"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Submit a Review
          </Link>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 md:mt-10">
          <div className="flex items-center justify-center gap-6">
          {(() => {
            const props = getSocialAnchorProps(socialLinks.x);
            return (
          <a href={props.href} target={props.target} rel={props.rel} className={`text-[var(--text-dim)] transition-colors hover:text-amber-200/70 ${props.className}`} aria-label="Twitter / X">
            <svg className="size-5 md:size-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
            );
          })()}
          {(() => {
            const props = getSocialAnchorProps(socialLinks.instagram);
            return (
          <a href={props.href} target={props.target} rel={props.rel} className={`text-[var(--text-dim)] transition-colors hover:text-amber-200/70 ${props.className}`} aria-label="Instagram">
            <svg className="size-5 md:size-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
            );
          })()}
          {(() => {
            const props = getSocialAnchorProps(socialLinks.threads);
            return (
          <a href={props.href} target={props.target} rel={props.rel} className={`text-[var(--text-dim)] transition-colors hover:text-amber-200/70 ${props.className}`} aria-label="Threads">
            <svg className="size-5 md:size-6" fill="currentColor" viewBox="0 0 192 192">
              <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
            </svg>
          </a>
            );
          })()}
          {(() => {
            const props = getSocialAnchorProps(socialLinks.tiktok);
            return (
          <a href={props.href} target={props.target} rel={props.rel} className={`text-[var(--text-dim)] transition-colors hover:text-amber-200/70 ${props.className}`} aria-label="TikTok">
            <svg className="size-5 md:size-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
          </a>
            );
          })()}
          {(() => {
            const props = getSocialAnchorProps(socialLinks.whatsapp);
            return (
          <a href={props.href} target={props.target} rel={props.rel} className={`text-[var(--text-dim)] transition-colors hover:text-amber-200/70 ${props.className}`} aria-label="WhatsApp">
            <svg className="size-5 md:size-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
            );
          })()}
          </div>
          {!hasAnySocialLink && (
            <p className="text-[11px] text-[var(--text-dim)]">Social links will appear here once configured.</p>
          )}
        </div>

        <div className="mt-12 border-t border-[var(--border)] pt-8 text-center text-xs text-stone-700 md:mt-16">
          &copy; {new Date().getFullYear()} Adam Workcraft. {t.contact.copyright}
        </div>
      </div>
    </section>
  );
}
