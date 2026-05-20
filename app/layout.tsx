import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/ui/custom-cursor";
import FluidBg from "@/components/ui/fluid-bg";
import { LanguageThemeProvider } from "@/context/language-theme-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Adam Workcraft | Wedding & Event Photography",
  description:
    "Premium wedding and event photography by Adam Workcraft. Capturing timeless moments with elegance and authenticity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageThemeProvider>
          <FluidBg />
          <CustomCursor />
          {children}
        </LanguageThemeProvider>
      </body>
    </html>
  );
}
