import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  KeyRound,
  UserPlus,
  RefreshCw,
  MailCheck,
  Database,
  Lock,
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck,
  User,
} from "lucide-react";

export default function Home() {
  const screens = [
    {
      title: "User Registration",
      href: "/register",
      icon: <UserPlus className="w-5 h-5 text-violet-400" />,
      tag: "Live Supabase Auth",
      tagVariant: "violet" as const,
      description:
        "Full name, lowercase email, DOB (13+), phone, address fields, dynamic password strength meter, RLS profile provisioning, and Google sign-up.",
    },
    {
      title: "Universal Sign-In",
      href: "/login",
      icon: <KeyRound className="w-5 h-5 text-cyan-400" />,
      tag: "Session SSR",
      tagVariant: "cyan" as const,
      description:
        "Email/password authentication with lowercase normalization, explicit phone provider boundary check, session persistence, and Google OAuth.",
    },
    {
      title: "Password Recovery",
      href: "/forgot-password",
      icon: <RefreshCw className="w-5 h-5 text-emerald-400" />,
      tag: "Live OTP Wizard",
      tagVariant: "emerald" as const,
      description:
        "4-step recovery wizard: secure email dispatch without account leakage, 6-digit OTP verification, 60s countdown, and cryptographic password reset.",
    },
    {
      title: "Protected Profile Dashboard",
      href: "/profile",
      icon: <User className="w-5 h-5 text-indigo-400" />,
      tag: "RLS Protected",
      tagVariant: "cyan" as const,
      description:
        "Server-side session verified profile viewer displaying isolated user claims from PostgreSQL public.profiles with one-click sign-out.",
    },
    {
      title: "Verification Pipeline",
      href: "/auth/verify",
      icon: <MailCheck className="w-5 h-5 text-amber-400" />,
      tag: "Live Resend API",
      tagVariant: "amber" as const,
      description:
        "Email confirmation instructions, resend verification token pipeline, and PKCE callback code exchange integration.",
    },
  ];

  const architecturalHighlights = [
    {
      icon: <Lock className="w-5 h-5 text-violet-400" />,
      title: "Zero-Leak Architecture",
      detail:
        "Passwords and OTPs are never stored in public profiles. Public password recovery responses never reveal user account existence.",
    },
    {
      icon: <Database className="w-5 h-5 text-cyan-400" />,
      title: "PostgreSQL & Strict RLS",
      detail:
        "public.profiles enforced by Row Level Security policies ensuring User A can never read or mutate User B's record.",
    },
    {
      icon: <Layers className="w-5 h-5 text-indigo-400" />,
      title: "Next.js 16 Proxy Session",
      detail:
        "Modern Next.js 16 proxy convention with @supabase/ssr cookie exchange and server-side route protection.",
    },
    {
      icon: <FileCheck className="w-5 h-5 text-emerald-400" />,
      title: "Strict Normalization",
      detail:
        "Automatic lowercase email normalization, strict age validation, and safe separation between email and SMS phone auth.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto w-full space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl pt-4">
        <div className="inline-flex items-center gap-2">
          <Badge variant="violet" className="py-1 px-3 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            Phase 2 Active: Live Supabase Auth Engine
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Next-Generation Authentication for{" "}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Modern SaaS
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
          NexusAuth delivers an enterprise-grade authentication interface designed with deep midnight navy aesthetics, electric violet glow, resilient Zod form validation, and real Supabase SSR session handling.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/register">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Test Registration Form
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Test Sign-In Screen
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline" size="lg">
              View Profile Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Screen Gallery */}
      <section className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-violet-400" />
              Live Authentication Screens & Flows
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Explore and test each authentication screen connected to Supabase Auth and PostgreSQL RLS
            </p>
          </div>
          <Badge variant="cyan">Phase 2 Engine Connected</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map((screen) => (
            <Card
              key={screen.href}
              className="group hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-950/30 transition-all duration-300 flex flex-col justify-between"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {screen.icon}
                  </div>
                  <Badge variant={screen.tagVariant}>{screen.tag}</Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-violet-300 transition-colors pt-2">
                  {screen.title}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed">
                  {screen.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href={screen.href} className="inline-flex w-full">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-between group-hover:border-violet-500/40"
                    rightIcon={<ArrowRight className="w-4 h-4 text-violet-400 group-hover:translate-x-1 transition-transform" />}
                  >
                    Open {screen.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="w-full space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Engineering & Security Architecture
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Built from first principles for performance, accessibility, and zero-knowledge privacy
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {architecturalHighlights.map((item, idx) => (
            <div
              key={idx}
              className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3-Phase Project Roadmap Card */}
      <section className="w-full">
        <Card elevated className="border-violet-500/20 bg-slate-950/70 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                NexusAuth Development Lifecycle
              </span>
              <h3 className="text-2xl font-bold text-white pt-1">
                Project Milestone Tracking
              </h3>
            </div>
            <Badge variant="emerald" className="self-start sm:self-auto">
              Phase 2 Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Phase 1 Box */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2 opacity-80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">PHASE 1</span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  COMPLETED
                </span>
              </div>
              <h4 className="font-semibold text-sm text-white">Foundation & Complete UI</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Next.js App Router, TypeScript strict mode, Tailwind design system, Zod validation schemas, Registration, Sign-in, Password Recovery wizard, and Callback screens.
              </p>
            </div>

            {/* Phase 2 Box */}
            <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/50 space-y-2 shadow-lg shadow-violet-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-300">PHASE 2 (CURRENT)</span>
                <span className="text-[10px] font-mono bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">
                  IMPLEMENTED
                </span>
              </div>
              <h4 className="font-semibold text-sm text-white">Real Supabase Auth & RLS</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                PostgreSQL schema & RLS migration, Supabase Auth sign-up, email verification, session SSR exchange via proxy, Google OAuth flow, and recovery OTP verification.
              </p>
            </div>

            {/* Phase 3 Box */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 opacity-60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">PHASE 3</span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  UPCOMING
                </span>
              </div>
              <h4 className="font-semibold text-sm text-slate-200">Profile & Hardening</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interactive profile editing, avatar uploads, multi-factor authentication (MFA), account deletion, E2E browser automation, and production deployment guide.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
