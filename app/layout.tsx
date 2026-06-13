import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND_ICON_MIME_TYPE, BRAND_ICON_PATH, BRAND_NAME } from '@/lib/branding';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} | Wedding & Event Photography`,
  description:
    "Premium wedding and event photography by Adam Workcraft. Capturing timeless moments with elegance and authenticity.",
  icons: {
    icon: [{ url: BRAND_ICON_PATH, type: BRAND_ICON_MIME_TYPE }],
    shortcut: [BRAND_ICON_PATH],
    apple: [{ url: BRAND_ICON_PATH, type: BRAND_ICON_MIME_TYPE }],
  },
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <Script id="theme-detect" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('admin_theme');if(t)document.documentElement.classList.add('admin-theme-'+t)}catch(e){}})()`}
        </Script>
        {children}
      </body>
    </html>
  );
}
