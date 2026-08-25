import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Student Portal Pro | Academic & Personal Command Center",
  description: "Unified academic management platform with 2-click task capture, native Google Classroom sync, AI study plan breakdown, and chronologically sorted exam schedules.",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem("student_portal_pro_theme") || localStorage.getItem("theme");
                if (saved === "light") {
                  document.documentElement.classList.remove("dark");
                  document.documentElement.classList.add("light");
                } else {
                  document.documentElement.classList.add("dark");
                }
              } catch (e) {}
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
      </body>
    </html>
  );
}
