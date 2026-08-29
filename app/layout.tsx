import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { Analytics } from '@vercel/analytics/next';

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Student Portal Pro | Academic & Personal Command Center",
  description: "Unified academic management platform with 2-click task capture, native Google Classroom sync, AI study plan breakdown, and chronologically sorted exam schedules.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StudentPortal"
  },
  openGraph: {
    title: "Student Portal Pro",
    description: "Your Academic & Personal Command Center, Unified.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#edf1f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem("student_portal_theme") || localStorage.getItem("student_portal_pro_theme") || localStorage.getItem("theme");
                if (saved === "dark") {
                  document.documentElement.classList.add("dark");
                } else {
                  document.documentElement.classList.remove("dark");
                }
              } catch (e) {}

              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `
          }}
        />
      </head>
      <body 
        className="antialiased selection:bg-[#1c69d4]/30 selection:text-white bg-[var(--canvas)] text-[var(--ink)]"
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
