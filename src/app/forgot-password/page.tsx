"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
} from "@/lib/validation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { KeyRound, Mail, ShieldAlert, CheckCircle2, RotateCcw, ArrowRight, ArrowLeft } from "lucide-react";

type RecoveryStep = "email" | "otp" | "reset" | "success";

export default function ForgotPasswordPage() {
  const [currentStep, setCurrentStep] = useState<RecoveryStep>("email");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mockNotice, setMockNotice] = useState<string | null>(null);

  // Step 1 Form: Email
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });

  // Step 3 Form: New Password
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    control: controlReset,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onBlur",
  });

  const newPasswordValue = useWatch({ control: controlReset, name: "password" }) || "";

  // Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === "otp" && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, resendCountdown]);

  // Handler: Submit Email (Step 1 -> Step 2)
  const onEmailSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsSubmitting(false);
    setRecoveryEmail(data.email);
    setCurrentStep("otp");
    setResendCountdown(60);
    setMockNotice("In Phase 1, demo OTP is any 6 digits (e.g. 123456). In Phase 2, Supabase Auth sends real token.");
  };

  // Handler: Submit OTP (Step 2 -> Step 3)
  const onOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      setOtpError("Please enter all 6 digits of the verification code");
      return;
    }
    setOtpError("");
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    setCurrentStep("reset");
  };

  // Handler: Resend Code
  const handleResendOtp = () => {
    if (resendCountdown > 0) return;
    setResendCountdown(60);
    setOtpValue("");
    setOtpError("");
    setMockNotice("A new 6-digit verification code was re-issued.");
  };

  // Handler: Submit New Password (Step 3 -> Step 4)
  const onResetSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setCurrentStep("success");
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto w-full">
      <Card elevated className="w-full">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 mb-2 shadow-lg shadow-violet-900/40">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              {currentStep === "success" ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : currentStep === "otp" ? (
                <ShieldAlert className="w-6 h-6 text-cyan-400" />
              ) : (
                <KeyRound className="w-6 h-6 text-violet-400" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl">
            {currentStep === "email" && "Recover Access"}
            {currentStep === "otp" && "Verify Security Code"}
            {currentStep === "reset" && "Create New Password"}
            {currentStep === "success" && "Password Reset Complete"}
          </CardTitle>
          <CardDescription>
            {currentStep === "email" &&
              "Enter your registered email address to receive an emergency security OTP"}
            {currentStep === "otp" &&
              `Enter the 6-digit code sent to ${recoveryEmail || "your email"}`}
            {currentStep === "reset" &&
              "Choose a resilient password complying with NexusAuth security standards"}
            {currentStep === "success" &&
              "Your credentials have been securely updated. You can now sign in."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Step Progression Indicators */}
          <div className="flex items-center justify-between px-2 pb-4">
            {(["email", "otp", "reset", "success"] as RecoveryStep[]).map((step, idx) => {
              const stepIndex = ["email", "otp", "reset", "success"].indexOf(currentStep);
              const isPast = stepIndex > idx;
              const isCurrent = stepIndex === idx;

              return (
                <div key={step} className="flex items-center gap-1.5 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                      isPast
                        ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                        : isCurrent
                        ? "bg-violet-600 border-violet-400 text-white shadow-md shadow-violet-500/30"
                        : "bg-slate-900 border-slate-800 text-slate-500"
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  {idx < 3 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 rounded-full ${
                        isPast ? "bg-emerald-500/50" : "bg-slate-800"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {mockNotice && (
            <Alert variant="info" title="Phase 1 Mock Notification">
              {mockNotice}
            </Alert>
          )}

          {/* STEP 1: Enter Email */}
          {currentStep === "email" && (
            <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-4" noValidate>
              <Input
                label="Registered Email Address"
                type="email"
                placeholder="name@company.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={emailErrors.email?.message}
                {...registerEmail("email")}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full text-base font-semibold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Recovery OTP
              </Button>
            </form>
          )}

          {/* STEP 2: Enter 6-digit OTP */}
          {currentStep === "otp" && (
            <form onSubmit={onOtpSubmit} className="space-y-5">
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-400">
                  Verification Code (6 Digits)
                </span>
                <OtpInput
                  value={otpValue}
                  onChange={(val) => {
                    setOtpValue(val);
                    if (otpError) setOtpError("");
                  }}
                  error={otpError}
                />
              </div>

              {/* Resend Countdown Interface */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <span className="text-slate-400">Didn&apos;t receive code?</span>
                {resendCountdown > 0 ? (
                  <span className="text-slate-500 font-mono">
                    Resend available in{" "}
                    <span className="text-cyan-400 font-semibold">{resendCountdown}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-violet-400 hover:text-cyan-300 font-semibold flex items-center gap-1 focus:outline-none"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Resend Code Now
                  </button>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={() => setCurrentStep("email")}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  isLoading={isSubmitting}
                  className="flex-1 font-semibold"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Verify Code
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: Create New Password */}
          {currentStep === "reset" && (
            <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-4" noValidate>
              <PasswordInput
                label="New Password"
                placeholder="••••••••••••"
                error={resetErrors.password?.message}
                {...registerReset("password")}
              />

              <PasswordInput
                label="Confirm New Password"
                placeholder="••••••••••••"
                error={resetErrors.confirmPassword?.message}
                {...registerReset("confirmPassword")}
              />

              <PasswordStrengthMeter password={newPasswordValue} />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full text-base font-semibold mt-2"
              >
                Set New Password
              </Button>
            </form>
          )}

          {/* STEP 4: Success State */}
          {currentStep === "success" && (
            <div className="py-6 space-y-4 text-center animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-950/60 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white">Password Updated</h3>
              <p className="text-sm text-slate-300">
                All existing sessions have been invalidated and your security credentials have been refreshed.
              </p>
              <div className="pt-2">
                <Link href="/login" className="inline-flex w-full justify-center">
                  <Button variant="primary" size="lg" className="w-full font-semibold">
                    Sign In with New Password
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
