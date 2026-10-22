"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, ExternalLink, X } from "lucide-react";

interface GoogleButtonProps {
  mode: "signup" | "signin";
  onClick?: () => void;
  disabled?: boolean;
}

export function GoogleButton({
  mode,
  onClick,
  disabled = false,
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (onClick) {
      onClick();
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setShowConfigModal(true);
        setLoading(false);
        return;
      }

      if (data?.url) {
        // Test if provider is enabled before sending user to a 400 page
        try {
          const checkRes = await fetch(data.url, { redirect: "manual" });
          if (checkRes.status === 400) {
            const body = await checkRes.json().catch(() => ({}));
            if (
              body.msg?.includes("not enabled") ||
              body.error_code === "validation_failed"
            ) {
              setErrorMessage(
                "Google OAuth provider is pending configuration in your Supabase Dashboard."
              );
              setShowConfigModal(true);
              setLoading(false);
              return;
            }
          }
        } catch {
          // If CORS prevents inspection, proceed to redirect
        }

        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OAuth initialization failed.";
      setErrorMessage(msg);
      setShowConfigModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        <Button
          type="button"
          variant="secondary"
          size="md"
          isLoading={loading}
          disabled={disabled}
          onClick={handleClick}
          className="w-full bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-200 relative group"
          leftIcon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.3l3.7 2.9C6.2 7.1 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.3C.6 9.3 0 10.6 0 12s.6 2.7 1.6 4.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.1L1.6 16.1C3.5 19.8 7.4 23 12 23z"
              />
            </svg>
          }
        >
          <span>{mode === "signup" ? "Sign up with Google" : "Continue with Google"}</span>
          <span className="ml-2 text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded">
            OAuth Pending
          </span>
        </Button>
      </div>

      {/* Configuration Instructions Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Google OAuth Setup Required</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-lg p-2.5 font-mono">
                {errorMessage}
              </p>
            )}

            <div className="text-xs text-slate-300 space-y-3">
              <p>
                NexusAuth is fully integrated with Supabase SSR OAuth flow. To activate live Google sign-in:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-400">
                <li>
                  Go to <strong className="text-slate-200">Google Cloud Console</strong> &rarr; APIs & Services &rarr; Credentials.
                </li>
                <li>
                  Create an <strong className="text-slate-200">OAuth 2.0 Client ID</strong> (Web Application).
                </li>
                <li>
                  Add Authorized Redirect URI:
                  <div className="mt-1 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800 text-cyan-400 break-all select-all">
                    https://ohkdiqnxfqygbzvjjpve.supabase.co/auth/v1/callback
                  </div>
                </li>
                <li>
                  Copy the Client ID and Secret into <strong className="text-slate-200">Supabase Dashboard</strong> &rarr; Authentication &rarr; Providers &rarr; Google &rarr; Enable Provider.
                </li>
              </ol>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-800">
              <a
                href="https://supabase.com/docs/guides/auth/social-login/auth-google"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                View Official Supabase Guide <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowConfigModal(false)}
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
