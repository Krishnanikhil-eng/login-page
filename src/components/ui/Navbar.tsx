"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Lock, Menu, X, Sparkles } from "lucide-react";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Overview" },
    { href: "/login", label: "Sign In" },
    { href: "/register", label: "Register" },
    { href: "/forgot-password", label: "Recovery" },
    { href: "/auth/verify", label: "Verify UI" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg p-1"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 shadow-md shadow-violet-900/40 group-hover:shadow-violet-600/50 transition-shadow">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-violet-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Nexus<span className="text-violet-400">Auth</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono -mt-1 tracking-wider uppercase">
              Enterprise Identity
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-violet-950/50 text-violet-300 border border-violet-500/30 shadow-sm shadow-violet-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Info / Phase Tag */}
        <div className="hidden sm:flex items-center gap-3">
          <Badge variant="cyan" className="text-[11px]">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Phase 1 Foundation
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-800 pl-3">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[11px]">Zero-Leak Guard</span>
          </div>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 pt-2 pb-4 space-y-1 backdrop-blur-2xl animate-fadeIn">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-violet-950/60 text-violet-300 border border-violet-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 mt-2">
            <Badge variant="cyan">Phase 1: Complete UI</Badge>
            <span className="font-mono text-[11px]">Supabase SSR Ready</span>
          </div>
        </div>
      )}
    </header>
  );
}
