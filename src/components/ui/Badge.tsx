import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "violet" | "cyan" | "emerald" | "amber" | "slate";
}

export function Badge({
  className,
  variant = "violet",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    violet: "bg-violet-950/60 border-violet-500/40 text-violet-300",
    cyan: "bg-cyan-950/60 border-cyan-500/40 text-cyan-300",
    emerald: "bg-emerald-950/60 border-emerald-500/40 text-emerald-300",
    amber: "bg-amber-950/60 border-amber-500/40 text-amber-300",
    slate: "bg-slate-800/80 border-slate-700 text-slate-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
