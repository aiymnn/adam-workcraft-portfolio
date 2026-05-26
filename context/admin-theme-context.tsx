'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type AdminTheme = 'light' | 'dark';

interface AdminThemeContextType {
  theme: AdminTheme;
  toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType | null>(null);

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) throw new Error('useAdminTheme must be used within AdminThemeProvider');
  return ctx;
}

function getInitialTheme(): AdminTheme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('admin-theme-dark') ? 'dark' : 'light';
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('admin_theme') as AdminTheme | null;
    if (stored && stored !== theme) {
      applyTheme(stored);
      setTheme(stored);
    }
  }, []);

  function applyTheme(t: AdminTheme) {
    document.documentElement.classList.remove('admin-theme-light', 'admin-theme-dark');
    document.documentElement.classList.add('admin-theme-' + t);
    localStorage.setItem('admin_theme', t);
  }

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      applyTheme(next);
      return next;
    });
  };

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
      <div
        className={`min-h-screen bg-[var(--bg-end)] text-[var(--text)] transition-colors duration-300 ${mounted ? '' : ''}`}
      >
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}
