import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

const badgeVariants: Record<string, string> = {
  default: "border-transparent bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
  secondary: "border-transparent bg-slate-800 text-slate-300",
  destructive: "border-transparent bg-red-500/10 text-red-400 border border-red-500/30",
  outline: "border border-slate-700 text-slate-300",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        badgeVariants[variant] || badgeVariants.default,
        className
      )}
      {...props}
    />
  );
}
