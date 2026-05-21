'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type AdminTheme = 'light' | 'dark';

const LIGHT_VARS: Record<string, string> = {
  '--text': '#1c1917',
  '--text-muted': '#57534e',
  '--text-dim': '#a8a29e',
  '--border': '#e7e5e4',
  '--button': '#ffffff',
  '--button-hover': '#f5f5f4',
  '--bg-start': '#ffffff',
  '--bg-mid': '#fafaf9',
  '--bg-end': '#f5f5f4',
};

const DARK_VARS: Record<string, string> = {
  '--text': '#f5f5f4',
  '--text-muted': '#a8a29e',
  '--text-dim': '#57534e',
  '--border': '#292524',
  '--button': '#292524',
  '--button-hover': '#44403c',
  '--bg-start': '#1c1917',
  '--bg-mid': '#292524',
  '--bg-end': '#0c0a09',
};

interface AdminThemeContextType {
  theme: AdminTheme;
  toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType | null>(null);

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) throw new Error('useAdminTheme must be used within AdminLayout');
  return ctx;
}

const THEME_INLINE_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('admin_theme');
    if (t === 'dark') {
      var e = document.currentScript.parentElement;
      e.style.setProperty('--text', '#f5f5f4');
      e.style.setProperty('--text-muted', '#a8a29e');
      e.style.setProperty('--text-dim', '#57534e');
      e.style.setProperty('--border', '#292524');
      e.style.setProperty('--button', '#292524');
      e.style.setProperty('--button-hover', '#44403c');
      e.style.setProperty('--bg-start', '#1c1917');
      e.style.setProperty('--bg-mid', '#292524');
      e.style.setProperty('--bg-end', '#0c0a09');
    }
  } catch(e) {}
})();
`;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>('light');

  useEffect(() => {
    const stored = localStorage.getItem('admin_theme') as AdminTheme | null;
    if (stored) setTheme(stored);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('admin_theme', next);
      return next;
    });
  };

  const vars = theme === 'light' ? LIGHT_VARS : DARK_VARS;

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
      <div
        className="min-h-screen bg-[var(--bg-end)] text-[var(--text)] transition-colors duration-300"
        style={vars as React.CSSProperties}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{ __html: THEME_INLINE_SCRIPT }}
        />
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}
