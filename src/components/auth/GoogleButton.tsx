"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

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

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(
        "Phase 1 Mock Preview: Google OAuth flow requested.\nIn Phase 2, this will redirect to Google Cloud OAuth credentials and process the Supabase callback."
      );
    }, 600);
  };

  return (
    <Button
      variant="secondary"
      size="md"
      isLoading={loading}
      disabled={disabled}
      onClick={handleClick}
      className="w-full bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-200"
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
      {mode === "signup" ? "Sign up with Google" : "Continue with Google"}
    </Button>
  );
}
