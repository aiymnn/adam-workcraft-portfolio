'use client';

import type { FormEvent } from 'react';
import MagneticButton from '@/components/ui/magnetic-button';
import { useLanguageTheme } from '@/context/language-theme-context';

export default function Contact() {
  const { t } = useLanguageTheme();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
              <p>{t.contact.phone}</p>
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
                className="w-full border-b border-[var(--border)] bg-transparent pb-3 text-sm text-[var(--text)] placeholder-stone-600 outline-none transition-colors focus:border-amber-700/50"
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
                className="w-full border-b border-[var(--border)] bg-transparent pb-3 text-sm text-[var(--text)] placeholder-stone-600 outline-none transition-colors focus:border-amber-700/50"
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
                className="w-full resize-none border-b border-[var(--border)] bg-transparent pb-3 text-sm text-[var(--text)] placeholder-stone-600 outline-none transition-colors focus:border-amber-700/50"
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

        <div className="mt-12 flex items-center justify-center gap-6 md:mt-16">
          <a href="#" className="text-[var(--text-dim)] transition-colors hover:text-amber-200/70" aria-label="Twitter / X">
            <svg className="size-5 md:size-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a href="#" className="text-[var(--text-dim)] transition-colors hover:text-amber-200/70" aria-label="Instagram">
            <svg className="size-5 md:size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75h-9A3.75 3.75 0 003.75 7.5v9a3.75 3.75 0 003.75 3.75h9a3.75 3.75 0 003.75-3.75v-9a3.75 3.75 0 00-3.75-3.75zM12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5zM17.25 6.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </a>
          <a href="#" className="text-[var(--text-dim)] transition-colors hover:text-amber-200/70" aria-label="Threads">
            <svg className="size-5 md:size-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.388 10.919c-.14-.044-.282-.086-.425-.125-.656-.181-1.367-.226-2.067-.133a6.05 6.05 0 00-.813.153c-.003-.01-.007-.019-.01-.028-1.408-4.173-4.62-6.153-7.45-5.658-1.37.24-2.58.997-3.507 2.189C2.215 8.637 1.9 10.243 2.085 12.004c.31 2.908 2.285 5.45 5.564 6.19 2.405.544 4.738.09 6.73-.87.035.023.07.046.105.07 1.66 1.156 3.208 2.309 4.528 4.215l.03.046c.475.73 1.326 1.132 2.518.945-1.638-.594-2.847-1.607-3.912-2.646-1.426-1.39-2.502-2.96-3.258-4.672.589-.134 1.2-.206 1.83-.206 1.201 0 2.148.16 3.004.478l.068.026c.306.108.636-.06.736-.39.079-.26.025-.527-.138-.714-.26-.297-.589-.547-.953-.749-.042-.023-.084-.046-.127-.067a6.45 6.45 0 00-.135-.071Zm-2.676 2.191c-.163.1-.336.186-.517.257a9.148 9.148 0 01-.628-1.595c.08-.02.16-.036.241-.05.528-.069 1.047-.038 1.487.093.175.052.342.12.498.202-.375.398-.723.733-1.081 1.092Z" />
            </svg>
          </a>
          <a href="#" className="text-[var(--text-dim)] transition-colors hover:text-amber-200/70" aria-label="TikTok">
            <svg className="size-5 md:size-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
          </a>
        </div>

        <div className="mt-12 border-t border-[var(--border)] pt-8 text-center text-xs text-stone-700 md:mt-16">
          &copy; {new Date().getFullYear()} Adam Workcraft. {t.contact.copyright}
        </div>
      </div>
    </section>
  );
}
