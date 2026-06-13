'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

type Language = 'en' | 'bm';

interface Dict {
  nav: Record<'home' | 'story' | 'gallery' | 'reviews' | 'connect', string>;
  hero: Record<'name' | 'title1' | 'title2' | 'subtitle' | 'viewWork' | 'getInTouch' | 'scroll', string>;
  about: Record<'label' | 'heading' | 'paragraph' | 'location' | 'servicesLabel', string> & { stats: Record<'weddings' | 'events' | 'experience' | 'clients', string>; servicesList: string[] };
  process: Record<'title' | 'subtitle' | 'step1_title' | 'step1_desc' | 'step2_title' | 'step2_desc' | 'step3_title' | 'step3_desc', string>;
  services: Record<'title' | 'subtitle' | 'photo' | 'video' | 'graphic', string>;
  gallery: Record<'title' | 'subtitle' | 'photography' | 'videography' | 'all' | 'graphic', string>;
  feedback: { title: string };
  contact: Record<'heading1' | 'heading2' | 'description' | 'namePlaceholder' | 'emailPlaceholder' | 'messagePlaceholder' | 'sendMessage' | 'email' | 'location' | 'copyright', string>;
  lightbox: Record<'close' | 'videography' | 'of', string>;
}

const en: Dict = {
  nav: { home: 'Home', story: 'Story', gallery: 'Gallery', reviews: 'Reviews', connect: 'Connect' },
  hero: { name: 'Adam Workcraft', title1: 'Visual', title2: 'Storyteller', subtitle: 'Cinematic wedding films, editorial photography, and brand content crafted with warmth and uncompromising artistry.', viewWork: 'View Work', getInTouch: 'Get in Touch', scroll: 'Scroll' },
  about: { label: 'About', heading: 'Every frame is a story\nwaiting to be told.', paragraph: 'Based in Johor, we craft visual legacies. We believe the most powerful images are felt, not just seen. Captured with patience and an obsessive eye for light, we turn fleeting moments into timeless art. Whether it\'s an intimate wedding or a corporate campaign, our mission is simple: tell your truth, craft it beautifully, and let the story breathe.', location: 'Professional studio based in Johor — available for travel worldwide based on date availability.', stats: { weddings: 'Weddings', events: 'Events', experience: 'Years', clients: 'Clients' }, servicesLabel: 'Services', servicesList: ['Cinematic Wedding Films', 'Intimate Engagements', 'Corporate Event Coverage', 'Pre-Wedding Photography', 'Documentary Storytelling', 'Event Highlights'] },
  process: { title: 'How We Work', subtitle: 'A structured, professional approach to delivering your vision.', step1_title: 'Discovery & Pre-Production', step1_desc: 'We discuss your vision, moodboards, and exact requirements.', step2_title: 'The Shoot', step2_desc: 'Capturing authentic moments with precision and creative flair.', step3_title: 'Editing & Delivery', step3_desc: 'Professional color grading, retouching, and timely delivery.' },
  services: { title: 'Expertise', subtitle: 'What I do best', photo: 'Photography', video: 'Videography', graphic: 'Graphic' },
  gallery: { title: 'The Work Vault', subtitle: 'A curated archive of weddings, editorial campaigns, and cinematic short films.', photography: 'Photography', videography: 'Videography', all: 'All Work', graphic: 'Graphic' },
  feedback: { title: 'What Couples & Brands Say' },
  contact: { heading1: 'Let\'s Create', heading2: 'Something Beautiful', description: 'Available for weddings, editorial shoots, and brand campaigns. Reach out and let\'s tell your story.', namePlaceholder: 'Your Name', emailPlaceholder: 'Your Email', messagePlaceholder: 'Tell me about your project', sendMessage: 'Send Message', email: 'hello@adamworkcraft.com', location: 'Based in Johor, Malaysia — covering KL, Negeri Sembilan, Melaka, and nearby states.', copyright: 'All rights reserved.' },
  lightbox: { close: 'Close', videography: 'Videography', of: 'of' },
};

const bm: Dict = {
  nav: { home: 'Utama', story: 'Kisah Kami', gallery: 'Portfolio', reviews: 'Ulasan', connect: 'Hubungi' },
  hero: { name: 'Adam Workcraft', title1: 'Pencerita', title2: 'Visual', subtitle: 'Karya sinematik perkahwinan, fotografi editorial, dan kempen komersial — dirakam dengan penuh nilai seni dan emosi.', viewWork: 'Lihat Portfolio', getInTouch: 'Hubungi Kami', scroll: 'Terokai' },
  about: { label: 'Tentang', heading: 'Setiap gambar ada\nkisahnya yang tersendiri.', paragraph: 'Berpangkalan di Johor, kami mencipta legasi visual. Kami percaya gambar yang hebat bukan sekadar cantik dipandang, tetapi sarat dengan emosi. Dengan kesabaran dan penelitian cahaya yang teliti, kami merakam setiap memori untuk dijadikan sebuah karya abadi. Dari majlis perkahwinan yang ringkas ke kempen korporat, misi kami hanya satu: menceritakan kisah anda dengan jujur, merakamnya dengan indah, dan biarkan karya itu berbicara.', location: 'Studio kami berpusat di Johor — sedia menerima tempahan dari luar bergantung pada kelapangan jadual.', stats: { weddings: 'Perkahwinan', events: 'Acara', experience: 'Tahun', clients: 'Pelanggan' }, servicesLabel: 'Perkhidmatan', servicesList: ['Filem Perkahwinan Sinematik', 'Sesi Pertunangan Intim', 'Liputan Acara Korporat', 'Fotografi Pra-Perkahwinan', 'Penceritaan Dokumentari', 'Sorotan Acara'] },
  process: { title: 'Cara Kami Bekerja', subtitle: 'Pendekatan profesional untuk merealisasikan visi anda.', step1_title: 'Sesi Perbincangan', step1_desc: 'Kita akan berbincang mengenai visi, konsep, dan keperluan spesifik anda.', step2_title: 'Sesi Penggambaran', step2_desc: 'Merakam setiap momen dengan teliti dan sentuhan kreatif yang unik.', step3_title: 'Suntingan Akhir', step3_desc: 'Sentuhan \'color grading\' profesional dan penyerahan karya tepat pada waktunya.' },
  services: { title: 'Kepakaran Kami', subtitle: 'Apa yang kami tawarkan', photo: 'Fotografi', video: 'Videografi', graphic: 'Grafik' },
  gallery: { title: 'Koleksi Karya', subtitle: 'Himpunan momen perkahwinan, kempen editorial, dan filem sinematik pilihan kami.', photography: 'Fotografi', videography: 'Videografi', all: 'Semua', graphic: 'Grafik' },
  feedback: { title: 'Apa Kata Pelanggan Kami' },
  contact: { heading1: 'Jom Cipta', heading2: 'Sesuatu Yang Indah', description: 'Sedia menerima tempahan untuk majlis perkahwinan, penggambaran komersial, dan editorial. Hubungi kami untuk mula bercerita.', namePlaceholder: 'Nama Anda', emailPlaceholder: 'Emel Anda', messagePlaceholder: 'Ceritakan tentang projek anda', sendMessage: 'Hantar Mesej', email: 'hello@adamworkcraft.com', location: 'Berpusat di Johor, Malaysia — liputan sekitar KL, Negeri Sembilan, Melaka, dan negeri berdekatan.', copyright: 'Hak cipta terpelihara.' },
  lightbox: { close: 'Tutup', videography: 'Videografi', of: 'dari' },
};

const dictionaries = { en, bm };

interface LanguageContextType {
  language: Language;
  t: Dict;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang);
    }
  }, []);

  useEffect(() => {
    const storedLang = localStorage.getItem('lang') as Language | null;
    if (storedLang) setLanguageState(storedLang);
  }, []);

  const t = dictionaries[language];

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
