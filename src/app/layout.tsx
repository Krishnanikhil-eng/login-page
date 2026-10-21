import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/ui/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NexusAuth — Production-Grade Authentication Engine",
  description:
    "Next.js App Router authentication system with Supabase SSR integration, zero-knowledge security, and responsive UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#070913] text-slate-100 selection:bg-violet-600/30 selection:text-violet-200">
        <Navbar />
        <main className="flex-1 flex flex-col relative z-10">{children}</main>
        
        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">NexusAuth</span>
              <span>— Phase 1: Foundation & UI System Complete</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="font-mono text-[11px]">Strict Zod Validation</span>
              <span className="text-slate-700">•</span>
              <span className="font-mono text-[11px]">Supabase SSR Ready</span>
              <span className="text-slate-700">•</span>
              <span className="font-mono text-[11px]">Zero-Leak Design</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
