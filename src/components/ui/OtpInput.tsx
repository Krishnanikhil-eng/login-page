"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  error,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const digits = value.split("");

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const newDigits = [...digits];
    while (newDigits.length < length) newDigits.push("");
    newDigits[index] = char;
    const newValue = newDigits.join("").slice(0, length);
    onChange(newValue);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    if (/^\d+$/.test(pastedData)) {
      const pasteDigits = pastedData.slice(0, length);
      onChange(pasteDigits);
      const focusIndex = Math.min(pasteDigits.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            disabled={disabled}
            value={digits[index] || ""}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${index + 1} of verification code`}
            className={cn(
              "w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl",
              "bg-slate-900/70 border border-slate-700/80 text-white",
              "focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
              "transition-all duration-200",
              digits[index] ? "border-violet-500/60 bg-violet-950/20 shadow-sm shadow-violet-500/10" : "",
              error ? "border-red-500/80 focus:border-red-500 text-red-200" : "",
              disabled ? "opacity-50 cursor-not-allowed" : ""
            )}
          />
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-400 text-center font-medium">{error}</p>
      )}
    </div>
  );
}
