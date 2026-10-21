"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { MailCheck, RotateCcw, ArrowRight, ShieldCheck, Inbox } from "lucide-react";

export default function VerifyPage() {
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleSimulateResend = () => {
    setResendStatus("Simulated verification link dispatched to inbox.");
    setTimeout(() => setResendStatus(null), 4000);
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto w-full">
      <Card elevated className="w-full text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 p-0.5 mb-2 shadow-lg shadow-cyan-900/40">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <MailCheck className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <div className="flex justify-center mb-1">
            <Badge variant="cyan">Verification Route (Phase 1 Preview)</Badge>
          </div>
          <CardTitle className="text-2xl sm:text-3xl">Verify Your Email Address</CardTitle>
          <CardDescription>
            We have prepared the secure email confirmation pipeline for NexusAuth.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="info" title="Phase 1 Architectural Placeholder">
            In Phase 2, Supabase Auth sends an email containing a secure HMAC-signed token or magic link redirecting to this verification screen.
          </Alert>

          {resendStatus && (
            <Alert variant="success" title="Notification">
              {resendStatus}
            </Alert>
          )}

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-left space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Inbox className="w-4 h-4 text-violet-400" /> What to expect in Phase 2:
            </h4>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
              <li>Automatic token extraction from query parameters (`?code=...` or `#access_token=...`)</li>
              <li>Server-side SSR token verification using `@supabase/ssr`</li>
              <li>Instant profile status upgrade from `unverified` to `verified`</li>
              <li>Seamless automatic redirect to user dashboard</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={handleSimulateResend}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Simulate Resend Email
            </Button>
            <Link href="/login" className="inline-flex">
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>

        <CardFooter className="justify-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Phishing & Man-in-the-Middle Resistant Architecture</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
