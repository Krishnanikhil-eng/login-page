"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { KeyRound, UserCheck, CheckCircle2, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submissionSuccess, setSubmissionSuccess] = useState<LoginFormData | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorParam = searchParams.get("error");
  const displayError = authError ?? (errorParam ? decodeURIComponent(errorParam) : null);

  const isVerificationError = Boolean(
    displayError &&
      (displayError.toLowerCase().includes("flow state") ||
        displayError.toLowerCase().includes("code exchange") ||
        displayError.toLowerCase().includes("verification") ||
        displayError.toLowerCase().includes("email not confirmed") ||
        displayError.toLowerCase().includes("otp") ||
        displayError.toLowerCase().includes("expired"))
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setAuthError(null);
    const supabase = createClient();

    const isEmail = data.identifier.includes("@");

    if (!isEmail) {
      // Identity design requirement: Treat phone/password login as a separate identity decision.
      // Do not pretend arbitrary phone input works with email/password authentication.
      setAuthError(
        "Phone authentication requires a configured SMS provider (e.g., Twilio or MessageBird) in the Supabase Dashboard. Please sign in with your registered email address."
      );
      setIsSubmitting(false);
      return;
    }

    const normalizedEmail = data.identifier.trim().toLowerCase();

    try {
      const { data: authResult, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: data.password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes("invalid login credentials")) {
          setAuthError("Invalid email or password. Please check your credentials and try again.");
        } else if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setAuthError(
            "Your email address has not been verified. Please check your inbox or visit the verification guide."
          );
        } else {
          setAuthError(signInError.message);
        }
        setIsSubmitting(false);
        return;
      }

      if (authResult.user) {
        setSubmissionSuccess(data);
        const redirectTo = searchParams.get("redirect") || "/profile";
        setTimeout(() => {
          router.push(redirectTo);
          router.refresh();
        }, 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected sign-in error occurred.";
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card elevated className="w-full">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 mb-2 shadow-lg shadow-violet-900/40">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-violet-400" />
          </div>
        </div>
        <CardTitle className="text-2xl sm:text-3xl">Sign in to NexusAuth</CardTitle>
        <CardDescription>
          Authenticate with your registered email address or verified phone number
        </CardDescription>
      </CardHeader>

      <CardContent>
        {displayError && (
          <div className="mb-4">
            <Alert
              variant="error"
              title={isVerificationError ? "Email Verification Notice" : "Authentication Error"}
            >
              <div className="space-y-2">
                <p className="text-xs sm:text-sm">
                  {isVerificationError
                    ? "Your email confirmation link has expired, was already used, or was opened on a different browser. Verification links are time-limited, single-use, and bound to the browser session where registration began."
                    : displayError}
                </p>

                {isVerificationError && (
                  <>
                    <div className="text-xs font-mono bg-rose-950/70 p-2.5 rounded-lg border border-rose-900/60 text-rose-300 break-all space-y-1">
                      <span className="font-semibold text-rose-200 block">Underlying error:</span>
                      <code>{displayError}</code>
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <Link
                        href="/auth/verify"
                        className="inline-flex items-center text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-4"
                      >
                        Request a fresh confirmation email &rarr;
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </Alert>
          </div>
        )}

        {submissionSuccess ? (
          <div className="py-6 space-y-4 animate-fadeIn text-center">
            <div className="w-14 h-14 bg-emerald-950/60 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-white">Authentication Succeeded!</h3>
            <p className="text-sm text-slate-300">
              Welcome back. Initializing secure session for{" "}
              <span className="text-cyan-300 font-mono font-medium">
                {submissionSuccess.identifier.toLowerCase()}
              </span>
            </p>
            <div className="bg-slate-950/80 rounded-xl p-3 text-left font-mono text-xs text-slate-400 border border-slate-800 space-y-1">
              <div>
                <span className="text-slate-500">Session Status:</span> Active & Encrypted
              </div>
              <div>
                <span className="text-slate-500">Redirecting:</span> Protected User Profile
              </div>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/profile" className="inline-flex justify-center">
                <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Go to Profile Now
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Google Social Sign In */}
            <div className="space-y-3">
              <GoogleButton mode="signin" />
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-[#11182f] px-3 text-xs uppercase tracking-wider text-slate-500 font-medium">
                  Or continue with credentials
                </span>
              </div>
            </div>

            {/* Identifier Input */}
            <Input
              label="Email or Phone Number"
              placeholder="ada@example.com or +1234567890"
              leftIcon={<UserCheck className="w-4 h-4" />}
              helperText="Enter your registered email or international phone number"
              error={errors.identifier?.message}
              {...register("identifier")}
            />

            {/* Password Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Password</span>
                <Link
                  href="/forgot-password"
                  className="text-xs text-violet-400 hover:text-cyan-300 transition-colors focus:outline-none focus:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                placeholder="••••••••••••"
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            {/* Remember Session Option */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-950"
                  {...register("rememberMe")}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-300">
                    Remember this session
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Keeps token refreshed across sessions on trusted devices
                  </span>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full text-base font-semibold mt-2"
            >
              Sign In to NexusAuth
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-slate-400 text-xs sm:text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-violet-400 hover:text-cyan-300 font-semibold transition-colors underline-offset-2 hover:underline"
          >
            Create Account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto w-full">
      <Suspense fallback={<div className="text-center text-slate-500 py-12">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
