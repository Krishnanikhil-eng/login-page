"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { User, Mail, Calendar, Phone, MapPin, Building, Globe, ShieldCheck, CheckCircle2, Inbox } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [submissionSuccess, setSubmissionSuccess] = useState<RegisterFormData | null>(null);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      dateOfBirth: "",
      countryCode: "+1",
      phoneNumber: "",
      streetAddress: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States",
      password: "",
      confirmPassword: "",
      acceptTerms: true,
    },
    mode: "onChange",
  });

  const passwordValue = useWatch({ control, name: "password" }) || "";

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setAuthError(null);

    const normalizedEmail = data.email.trim().toLowerCase();
    const supabase = createClient();

    try {
      const { data: authResult, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            date_of_birth: data.dateOfBirth,
            country_code: data.countryCode,
            phone_number: data.phoneNumber,
            street_address: data.streetAddress,
            city: data.city,
            state: data.state,
            postal_code: data.postalCode,
            country: data.country,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile`,
        },
      });

      if (signUpError) {
        if (
          signUpError.message.toLowerCase().includes("already registered") ||
          signUpError.message.toLowerCase().includes("already in use")
        ) {
          setAuthError(
            "An account with this email address already exists. Please sign in or use password recovery."
          );
        } else {
          setAuthError(signUpError.message);
        }
        setIsSubmitting(false);
        return;
      }

      // Check for user enumeration protection where Supabase returns empty identities for existing users
      if (
        authResult.user &&
        authResult.user.identities &&
        authResult.user.identities.length === 0
      ) {
        setAuthError(
          "An account with this email address already exists. Please sign in or use password recovery."
        );
        setIsSubmitting(false);
        return;
      }

      setRegisteredEmail(normalizedEmail);

      // If a session was immediately established (e.g. email confirmation disabled in Supabase)
      if (authResult.session) {
        // Also attempt client-side profile upsert in case the DB trigger is pending
        try {
          await supabase.from("profiles").upsert(
            {
              id: authResult.user?.id,
              full_name: data.fullName,
              email: normalizedEmail,
              date_of_birth: data.dateOfBirth || null,
              country_code: data.countryCode,
              phone_number: data.phoneNumber,
              street_address: data.streetAddress,
              city: data.city,
              state: data.state,
              postal_code: data.postalCode,
              country: data.country,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        } catch {
          // Non-blocking: DB trigger on auth.users will handle provisioning
        }

        setSubmissionSuccess(data);
        setEmailConfirmationRequired(false);
      } else {
        // Email verification required
        setEmailConfirmationRequired(true);
        setSubmissionSuccess(data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected registration error occurred.";
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full">
      <Card elevated className="w-full">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 mb-2 shadow-lg shadow-violet-900/40">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-violet-400" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl">Create your Nexus account</CardTitle>
          <CardDescription>
            Join NexusAuth with zero-knowledge password architecture and hardware-grade security
          </CardDescription>
        </CardHeader>

        <CardContent>
          {authError && (
            <div className="mb-4">
              <Alert variant="error" title="Registration Error">
                {authError}
              </Alert>
            </div>
          )}

          {submissionSuccess ? (
            <div className="py-6 space-y-4 animate-fadeIn text-center">
              <div className="w-14 h-14 bg-emerald-950/60 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                {emailConfirmationRequired ? (
                  <Inbox className="w-8 h-8 text-cyan-400" />
                ) : (
                  <CheckCircle2 className="w-8 h-8" />
                )}
              </div>

              <h3 className="text-xl font-semibold text-white">
                {emailConfirmationRequired
                  ? "Verify Your Email Address"
                  : "Account Successfully Created!"}
              </h3>

              <p className="text-sm text-slate-300 max-w-md mx-auto">
                {emailConfirmationRequired ? (
                  <>
                    A verification link has been dispatched to{" "}
                    <span className="text-cyan-400 font-semibold">{registeredEmail}</span>.
                    Please check your inbox to confirm your account and activate your profile.
                  </>
                ) : (
                  <>
                    Welcome to NexusAuth,{" "}
                    <span className="text-violet-400 font-semibold">{submissionSuccess.fullName}</span>!
                    Your authenticated session is active and your profile record is provisioned.
                  </>
                )}
              </p>

              <div className="bg-slate-950/80 rounded-xl p-4 text-left font-mono text-xs text-slate-400 border border-slate-800 space-y-1">
                <div><span className="text-slate-500">Name:</span> {submissionSuccess.fullName}</div>
                <div><span className="text-slate-500">Email:</span> {registeredEmail || submissionSuccess.email}</div>
                <div><span className="text-slate-500">Phone:</span> {submissionSuccess.countryCode} {submissionSuccess.phoneNumber}</div>
                <div><span className="text-slate-500">DOB:</span> {submissionSuccess.dateOfBirth}</div>
                <div><span className="text-slate-500">Address:</span> {submissionSuccess.city}, {submissionSuccess.country}</div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                {emailConfirmationRequired ? (
                  <>
                    <Link href="/auth/verify" className="inline-flex">
                      <Button variant="secondary">View Verification Guide</Button>
                    </Link>
                    <Link href="/login" className="inline-flex">
                      <Button variant="primary">Proceed to Sign In</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => router.push("/profile")}
                    >
                      Go to Your Profile
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Google Social Sign Up */}
              <div className="space-y-3">
                <GoogleButton mode="signup" />
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-800 w-full" />
                  <span className="bg-[#11182f] px-3 text-xs uppercase tracking-wider text-slate-500 font-medium">
                    Or register with credentials
                  </span>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Identity & Contact
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="Ada Lovelace"
                    leftIcon={<User className="w-4 h-4" />}
                    error={errors.fullName?.message}
                    {...register("fullName")}
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="ada@example.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                    error={errors.email?.message}
                    {...register("email")}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Date of Birth"
                    type="date"
                    leftIcon={<Calendar className="w-4 h-4" />}
                    helperText="Must be at least 13 years old"
                    error={errors.dateOfBirth?.message}
                    {...register("dateOfBirth")}
                  />

                  <div className="w-full space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Phone Number <span className="text-violet-400 ml-0.5">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        className="rounded-xl px-2.5 py-2.5 text-xs text-slate-200 bg-slate-900/60 border border-slate-700/70 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                        {...register("countryCode")}
                      >
                        <option value="+1">+1 (US/CA)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+91">+91 (IN)</option>
                        <option value="+61">+61 (AU)</option>
                        <option value="+49">+49 (DE)</option>
                        <option value="+33">+33 (FR)</option>
                        <option value="+81">+81 (JP)</option>
                      </select>
                      <div className="flex-1">
                        <Input
                          placeholder="2345678900"
                          leftIcon={<Phone className="w-4 h-4" />}
                          error={errors.phoneNumber?.message}
                          {...register("phoneNumber")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                <h4 className="text-xs font-semibold tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Residential Address
                </h4>

                <Input
                  label="Street Address"
                  placeholder="100 Enterprise Way, Suite 400"
                  leftIcon={<Building className="w-4 h-4" />}
                  error={errors.streetAddress?.message}
                  {...register("streetAddress")}
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Input
                    label="City"
                    placeholder="San Francisco"
                    error={errors.city?.message}
                    {...register("city")}
                  />
                  <Input
                    label="State / Province"
                    placeholder="California"
                    error={errors.state?.message}
                    {...register("state")}
                  />
                  <Input
                    label="Postal / ZIP"
                    placeholder="94105"
                    error={errors.postalCode?.message}
                    {...register("postalCode")}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Country <span className="text-violet-400 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    <select
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm text-slate-200 bg-slate-900/60 border border-slate-700/70 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                      {...register("country")}
                    >
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="India">India</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Security & Password */}
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                <h4 className="text-xs font-semibold tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Authentication Credentials
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PasswordInput
                    label="Create Password"
                    placeholder="••••••••••••"
                    error={errors.password?.message}
                    {...register("password")}
                  />

                  <PasswordInput
                    label="Confirm Password"
                    placeholder="••••••••••••"
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword")}
                  />
                </div>

                {/* Password strength dynamic meter */}
                <PasswordStrengthMeter password={passwordValue} />
              </div>

              {/* Terms & Conditions Acceptance */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-950"
                    {...register("acceptTerms")}
                  />
                  <span className="text-xs text-slate-300 leading-normal">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-violet-400 hover:text-cyan-300 underline font-medium focus:outline-none"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-violet-400 hover:text-cyan-300 underline font-medium focus:outline-none"
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="text-xs text-red-400 font-medium mt-1">
                    {errors.acceptTerms.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full text-base font-semibold"
              >
                Create Nexus Account
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-slate-400 text-xs sm:text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-violet-400 hover:text-cyan-300 font-semibold transition-colors underline-offset-2 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>

      {/* Terms Modal dialog */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">NexusAuth Terms of Service</h3>
            <div className="text-xs text-slate-300 space-y-2 max-h-60 overflow-y-auto pr-2">
              <p>1. <strong>Identity Protection:</strong> NexusAuth enforces cryptographic token protection, rate limiting, and zero-leak session boundaries.</p>
              <p>2. <strong>Data Privacy:</strong> User details are strictly segmented via PostgreSQL Row Level Security policies.</p>
              <p>3. <strong>Security Standards:</strong> Real-time session encryption and multi-factor capabilities protect your personal information.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowTermsModal(false)}
              >
                Close Terms
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
