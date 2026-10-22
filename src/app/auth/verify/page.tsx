"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { MailCheck, RotateCcw, ArrowRight, ShieldCheck, Inbox, Mail } from "lucide-react";

export default function VerifyPage() {
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail || !resendEmail.includes("@")) {
      setResendError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setResendStatus(null);
    setResendError(null);

    const supabase = createClient();
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: resendEmail.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile`,
        },
      });

      if (error) {
        setResendError(error.message);
      } else {
        setResendStatus(
          `Verification link re-dispatched to ${resendEmail.trim().toLowerCase()}. Please check your inbox and spam folder.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to dispatch verification email.";
      setResendError(msg);
    } finally {
      setIsLoading(false);
    }
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
            <Badge variant="cyan">Supabase Verification Pipeline</Badge>
          </div>
          <CardTitle className="text-2xl sm:text-3xl">Verify Your Email Address</CardTitle>
          <CardDescription>
            NexusAuth requires email verification to ensure account ownership and security
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {resendStatus && (
            <Alert variant="success" title="Email Dispatched">
              {resendStatus}
            </Alert>
          )}

          {resendError && (
            <Alert variant="error" title="Resend Error">
              {resendError}
            </Alert>
          )}

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-left space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Inbox className="w-4 h-4 text-violet-400" /> How Email Verification Works:
            </h4>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
              <li>When you register, Supabase dispatches a confirmation email containing a cryptographic link.</li>
              <li>Clicking the link redirects to <code className="text-cyan-400 font-mono">/auth/callback</code> with an authorization code.</li>
              <li>Our server exchanges the code for a verified session and activates your profile.</li>
              <li>If you haven&apos;t received your link, request a new dispatch below.</li>
            </ul>
          </div>

          <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
            <Input
              label="Need another verification link?"
              type="email"
              placeholder="Enter your registered email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <Button
              type="submit"
              variant="outline"
              size="md"
              isLoading={isLoading}
              className="w-full"
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Resend Verification Email
            </Button>
          </form>

          <div className="pt-2">
            <Link href="/login" className="inline-flex w-full justify-center">
              <Button
                variant="primary"
                size="md"
                className="w-full font-semibold"
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
