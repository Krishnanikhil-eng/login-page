import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
}

export function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: AlertProps) {
  const icons = {
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0" aria-hidden="true" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" aria-hidden="true" />,
  };

  const styles = {
    info: "bg-cyan-950/30 border-cyan-500/30 text-cyan-200",
    success: "bg-emerald-950/30 border-emerald-500/30 text-emerald-200",
    warning: "bg-amber-950/30 border-amber-500/30 text-amber-200",
    error: "bg-red-950/30 border-red-500/30 text-red-200",
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 p-4 rounded-xl border text-sm leading-relaxed backdrop-blur-md",
        styles[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="space-y-1">
        {title && <h5 className="font-semibold text-white tracking-wide text-xs uppercase">{title}</h5>}
        <div className="text-xs sm:text-sm text-slate-300">{children}</div>
      </div>
    </div>
  );
}
