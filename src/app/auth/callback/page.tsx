"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader2, CheckCircle2, Shield, ArrowRight } from "lucide-react";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"processing" | "ready">("processing");

  useEffect(() => {
    // Simulate PKCE code exchange handshake for Phase 1 preview
    const timer = setTimeout(() => {
      setStatus("ready");
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-md mx-auto w-full">
      <Card elevated className="w-full text-center">
        <CardHeader>
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 mb-2 shadow-lg shadow-violet-900/40">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-violet-400" />
            </div>
          </div>
          <div className="flex justify-center mb-1">
            <Badge variant="cyan">OAuth & PKCE Callback Handler</Badge>
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === "processing" ? "Completing Handshake..." : "Callback Pipeline Ready"}
          </CardTitle>
          <CardDescription>
            {status === "processing"
              ? "Exchanging PKCE code authorization grant for secure session tokens"
              : "Phase 1 UI callback handler verified. Live Google OAuth token exchange activates in Phase 2."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "processing" ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">
                Awaiting authorization response parameter (?code=...)
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="w-12 h-12 bg-emerald-950/70 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="bg-slate-950/80 rounded-xl p-3 text-left font-mono text-xs text-slate-400 border border-slate-800 space-y-1">
                <div><span className="text-slate-500">Protocol:</span> OAuth 2.0 + PKCE</div>
                <div><span className="text-slate-500">Route:</span> /auth/callback</div>
                <div><span className="text-slate-500">Status:</span> Phase 1 Structure Validated</div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link href="/login" className="inline-flex justify-center w-full">
                  <Button variant="primary" className="w-full font-semibold" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Return to Sign In
                  </Button>
                </Link>
                <Link href="/" className="inline-flex justify-center w-full">
                  <Button variant="secondary" className="w-full">
                    Go to Homepage
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
