'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

type Language = 'en' | 'bm';

interface Dict {
  nav: Record<'home' | 'story' | 'gallery' | 'reviews' | 'connect', string>;
  hero: Record<'name' | 'title1' | 'title2' | 'subtitle' | 'viewWork' | 'getInTouch' | 'scroll', string>;
  about: Record<'label' | 'heading' | 'paragraph' | 'location' | 'servicesLabel', string> & { stats: Record<'weddings' | 'events' | 'experience' | 'clients', string> };
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
  about: { label: 'About', heading: 'Every frame is a story\nwaiting to be told.', paragraph: 'I\'m Adam Workcraft — a freelance photographer, filmmaker, and graphic designer based in Johor. I believe the best images are the ones that feel invisible; moments captured with patience, warmth, and an obsessive eye for light. Whether it\'s a wedding, a corporate campaign, or a short film, I bring the same dedication: tell the truth, make it beautiful, and let the story breathe.', location: 'Freelance professional based in Johor — available for travel worldwide based on date availability.', stats: { weddings: 'Weddings', events: 'Events', experience: 'Years', clients: 'Clients' }, servicesLabel: 'Services' },
  process: { title: 'How We Work', subtitle: 'A structured, professional approach to delivering your vision.', step1_title: 'Discovery & Pre-Production', step1_desc: 'We discuss your vision, moodboards, and exact requirements.', step2_title: 'The Shoot', step2_desc: 'Capturing authentic moments with precision and creative flair.', step3_title: 'Editing & Delivery', step3_desc: 'Professional color grading, retouching, and timely delivery.' },
  services: { title: 'Expertise', subtitle: 'What I do best', photo: 'Photography', video: 'Videography', graphic: 'Graphic' },
  gallery: { title: 'The Work Vault', subtitle: 'A curated archive of weddings, editorial campaigns, and cinematic short films.', photography: 'Photography', videography: 'Videography', all: 'All Work', graphic: 'Graphic' },
  feedback: { title: 'What Couples & Brands Say' },
  contact: { heading1: 'Let\'s Create', heading2: 'Something Beautiful', description: 'Available for weddings, editorial shoots, and brand campaigns. Reach out and let\'s tell your story.', namePlaceholder: 'Your Name', emailPlaceholder: 'Your Email', messagePlaceholder: 'Tell me about your project', sendMessage: 'Send Message', email: 'hello@adamworkcraft.com', location: 'Based in Johor, Malaysia — covering KL, Negeri Sembilan, Melaka, and nearby states.', copyright: 'All rights reserved.' },
  lightbox: { close: 'Close', videography: 'Videography', of: 'of' },
};

const bm: Dict = {
  nav: { home: 'Utama', story: 'Cerita', gallery: 'Galeri', reviews: 'Ulasan', connect: 'Hubungi' },
  hero: { name: 'Adam Workcraft', title1: 'Visual', title2: 'Pencerita', subtitle: 'Filem perkahwinan sinematik, fotografi editorial, dan kandungan jenama — semuanya dihasilkan dengan penuh kehangatan dan sentuhan seni yang tinggi.', viewWork: 'Lihat Portfolio', getInTouch: 'Hubungi Saya', scroll: 'Skrol' },
  about: { label: 'Tentang Saya', heading: 'Setiap bingkai ada kisahnya yang tersendiri.', paragraph: 'Saya Adam Workcraft — jurugambar bebas, pembikin filem, dan pereka grafik yang berpangkalan di Johor. Saya percaya gambar terbaik ialah yang terasa natural; detik-detik dirakam dengan sabar, penuh kehangatan, dan mata yang teliti terhadap cahaya. Sama ada majlis perkahwinan, kempen korporat, atau filem pendek, saya membawa dedikasi yang sama: bercerita dengan jujur, hasilkan yang indah, dan biarkan kisah itu bernafas.', location: 'Bebas profesional berpangkalan di Johor — tersedia untuk perjalanan ke seluruh dunia berdasarkan ketersediaan tarikh.', stats: { weddings: 'Perkahwinan', events: 'Acara', experience: 'Tahun', clients: 'Pelanggan' }, servicesLabel: 'Perkhidmatan' },
  process: { title: 'Proses Kerja', subtitle: 'Pendekatan berstruktur profesional untuk merealisasikan visi anda.', step1_title: 'Penemuan & Pra-Produksi', step1_desc: 'Kami membincangkan visi anda, papan mood, dan keperluan yang tepat.', step2_title: 'Penggambaran', step2_desc: 'Merakam detik-detik tulen dengan ketepatan dan sentuhan kreatif.', step3_title: 'Suntingan & Penyerahan', step3_desc: 'Penyerian warna profesional, suntingan akhir, dan penyerahan tepat pada masa.' },
  services: { title: 'Kepakaran', subtitle: 'Perkhidmatan Utama', photo: 'Fotografi', video: 'Videografi', graphic: 'Grafik' },
  gallery: { title: 'Koleksi Portfolio', subtitle: 'Koleksi terpilih perkahwinan, kempen editorial, dan filem pendek sinematik.', photography: 'Fotografi', videography: 'Videografi', all: 'Semua', graphic: 'Grafik' },
  feedback: { title: 'Apa Kata Pasangan & Jenama' },
  contact: { heading1: 'Mari Cipta', heading2: 'Sesuatu yang Indah', description: 'Terbuka untuk tempahan perkahwinan, penggambaran editorial, dan kempen jenama. Hubungi saya dan mari kita hasilkan sesuatu yang istimewa.', namePlaceholder: 'Nama Anda', emailPlaceholder: 'Emel Anda', messagePlaceholder: 'Ceritakan tentang projek anda', sendMessage: 'Hantar Mesej', email: 'hello@adamworkcraft.com', location: 'Berpusat di Johor, Malaysia — liputan sekitar KL, Negeri Sembilan, Melaka, dan negeri berdekatan.', copyright: 'Hak cipta terpelihara.' },
  lightbox: { close: 'Tutup', videography: 'Videografi', of: 'daripada' },
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
