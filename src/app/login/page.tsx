"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { KeyRound, UserCheck, CheckCircle2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [submissionSuccess, setSubmissionSuccess] = useState<LoginFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    // Simulate Phase 1 mock validation flow
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setSubmissionSuccess(data);
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto w-full">
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
          <Alert variant="info" title="Phase 1 Mock State">
            Client-side validation verifies identifier format (email or phone). Supabase session exchange activates in Phase 2.
          </Alert>

          {submissionSuccess ? (
            <div className="py-6 space-y-4 animate-fadeIn text-center">
              <div className="w-14 h-14 bg-emerald-950/60 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-white">Validation Succeeded!</h3>
              <p className="text-sm text-slate-300">
                Ready to authenticate identifier:{" "}
                <span className="text-cyan-300 font-mono font-medium">
                  {submissionSuccess.identifier}
                </span>
              </p>
              <div className="bg-slate-950/80 rounded-xl p-3 text-left font-mono text-xs text-slate-400 border border-slate-800 space-y-1">
                <div>
                  <span className="text-slate-500">Identifier Type:</span>{" "}
                  {submissionSuccess.identifier.includes("@") ? "Email Address" : "Phone Number"}
                </div>
                <div>
                  <span className="text-slate-500">Session Persistence:</span>{" "}
                  {submissionSuccess.rememberMe ? "Extended (30 days)" : "Session-only (Browser close)"}
                </div>
                <div>
                  <span className="text-slate-500">Password Handled:</span> Sanitized & Zero-Knowledge Kept
                </div>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Button variant="outline" onClick={() => setSubmissionSuccess(null)}>
                  Try Another Account
                </Button>
                <Link href="/" className="inline-flex justify-center">
                  <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Return to Architecture Hub
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
                helperText="Enter either your registered email or phone with country code"
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
                      Keeps token refreshed for 30 days on secure trusted devices
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
    </div>
  );
}
