"use client";

import React from "react";
import { evaluatePasswordStrength } from "@/lib/validation";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password?: string;
  className?: string;
}

export function PasswordStrengthMeter({
  password = "",
  className,
}: PasswordStrengthMeterProps) {
  if (!password) {
    return null;
  }

  const strength = evaluatePasswordStrength(password);

  const criteria = [
    { label: "At least 8 characters", met: strength.hasMinLength },
    { label: "Uppercase letter (A-Z)", met: strength.hasUppercase },
    { label: "Lowercase letter (a-z)", met: strength.hasLowercase },
    { label: "At least one number (0-9)", met: strength.hasNumber },
    { label: "Special symbol (!@#$%^&*)", met: strength.hasSymbol },
  ];

  return (
    <div className={cn("space-y-2.5 pt-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">Password Strength</span>
        <span
          className={cn(
            "font-semibold text-xs transition-colors",
            strength.score === 0 && "text-red-400",
            strength.score === 1 && "text-orange-400",
            strength.score === 2 && "text-amber-400",
            strength.score === 3 && "text-cyan-400",
            strength.score === 4 && "text-emerald-400"
          )}
        >
          {strength.label}
        </span>
      </div>

      {/* Segmented meter */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[0, 1, 2, 3].map((step) => {
          const isActive = strength.score > step;
          return (
            <div
              key={step}
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isActive
                  ? strength.color
                  : "bg-slate-800/80"
              )}
            />
          );
        })}
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
        {criteria.map((item, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-1.5 text-[11px] transition-colors",
              item.met ? "text-slate-300 font-medium" : "text-slate-500"
            )}
          >
            {item.met ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
