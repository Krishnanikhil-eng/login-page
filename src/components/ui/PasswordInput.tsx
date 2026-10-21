"use client";

import React, { useState } from "react";
import { Input, type InputProps } from "./Input";
import { Eye, EyeOff, Lock } from "lucide-react";

export interface PasswordInputProps extends Omit<InputProps, "type" | "rightIcon"> {
  showLockIcon?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showLockIcon = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        leftIcon={showLockIcon ? <Lock className="w-4 h-4" /> : undefined}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:text-violet-400"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";
