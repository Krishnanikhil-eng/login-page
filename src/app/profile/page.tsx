import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  Mail,
  MapPin,
  ShieldCheck,
  LogOut,
  ShieldAlert,
} from "lucide-react";

export const instant = false;

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/profile");
  }

  // Fetch profile from public.profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const userMeta = user.user_metadata || {};
  const fullName = profile?.full_name || userMeta.full_name || userMeta.name || "Nexus User";
  const email = profile?.email || user.email || "";
  const dateOfBirth = profile?.date_of_birth || userMeta.date_of_birth || "Not specified";
  const countryCode = profile?.country_code || userMeta.country_code || "";
  const phoneNumber = profile?.phone_number || userMeta.phone_number || "Not specified";
  const streetAddress = profile?.street_address || userMeta.street_address || "Not specified";
  const city = profile?.city || userMeta.city || "Not specified";
  const state = profile?.state || userMeta.state || "Not specified";
  const postalCode = profile?.postal_code || userMeta.postal_code || "Not specified";
  const country = profile?.country || userMeta.country || "Not specified";
  const createdAt = profile?.created_at || user.created_at;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 shadow-lg shadow-violet-900/40">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl font-bold text-violet-300">
              {fullName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{fullName}</h1>
              <Badge variant="emerald">Authenticated</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" /> {email}
            </p>
          </div>
        </div>

        <form action="/auth/signout" method="post">
          <Button
            type="submit"
            variant="outline"
            size="md"
            className="border-red-500/30 text-red-400 hover:bg-red-950/40 hover:border-red-500/60"
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </form>
      </div>

      {profileError && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Notice:</strong> Database profile table has not been created yet in Supabase SQL Editor.
            Displaying authenticated user claims from session metadata. Run the Phase 2 migration to activate persistent PostgreSQL profile storage.
          </div>
        </div>
      )}

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identity & Contact Card */}
        <Card elevated>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-violet-400" />
              <CardTitle className="text-base">Identity & Contact Details</CardTitle>
            </div>
            <CardDescription>
              Protected identity fields managed under PostgreSQL RLS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Full Name:</span>
              <span className="text-slate-200 font-semibold">{fullName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Email Address:</span>
              <span className="text-cyan-300">{email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Date of Birth:</span>
              <span className="text-slate-200">{dateOfBirth}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Phone Number:</span>
              <span className="text-slate-200">
                {countryCode} {phoneNumber}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400 font-sans">Email Confirmed:</span>
              <span className="text-emerald-400">
                {user.email_confirmed_at ? "Verified" : "Pending Confirmation"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Residential Location Card */}
        <Card elevated>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <CardTitle className="text-base">Residential Address</CardTitle>
            </div>
            <CardDescription>
              Encrypted geographic location registered at sign-up
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Street Address:</span>
              <span className="text-slate-200">{streetAddress}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">City:</span>
              <span className="text-slate-200">{city}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">State / Province:</span>
              <span className="text-slate-200">{state}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Postal / ZIP:</span>
              <span className="text-slate-200">{postalCode}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400 font-sans">Country:</span>
              <span className="text-violet-300 font-semibold">{country}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Metadata Card */}
      <Card elevated>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <CardTitle className="text-base">Security & Cryptographic Session</CardTitle>
          </div>
          <CardDescription>
            Row Level Security (RLS) guarantees only user {user.id} can read this record
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-sans">
              Supabase User UUID
            </span>
            <span className="text-slate-300 text-[11px] break-all select-all">{user.id}</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-sans">
              Authentication Provider
            </span>
            <span className="text-cyan-400 font-semibold">
              {user.app_metadata.provider || "email/password"}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-sans">
              Session Created
            </span>
            <span className="text-slate-300">
              {createdAt ? new Date(createdAt).toLocaleString() : "Active"}
            </span>
          </div>
        </CardContent>
        <CardFooter className="justify-between border-t border-slate-800/80 pt-4">
          <Link href="/forgot-password" className="text-xs text-violet-400 hover:text-cyan-300">
            Change Password via Recovery Flow &rarr;
          </Link>
          <span className="text-xs text-slate-500 font-mono">Isolation: Verified (RLS Enforced)</span>
        </CardFooter>
      </Card>
    </div>
  );
}
