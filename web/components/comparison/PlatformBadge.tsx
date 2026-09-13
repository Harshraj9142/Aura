"use client";

import React from "react";
import { Building2, Globe, Sparkles } from "lucide-react";

interface PlatformBadgeProps {
  source: string;
  sourceType: "airline" | "ota";
  isBest?: boolean;
  className?: string;
  size?: "sm" | "md";
}

const PLATFORM_CONFIG: Record<
  string,
  { name: string; bg: string; text: string; border: string; accent: string }
> = {
  indigo: {
    name: "IndiGo Direct",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    accent: "bg-blue-600",
  },
  airindia: {
    name: "Air India Direct",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    accent: "bg-red-600",
  },
  easemytrip: {
    name: "EaseMyTrip",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    accent: "bg-emerald-600",
  },
  cleartrip: {
    name: "Cleartrip",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    accent: "bg-amber-500",
  },
  ixigo: {
    name: "Ixigo",
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200",
    accent: "bg-purple-600",
  },
  makemytrip: {
    name: "MakeMyTrip",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    accent: "bg-rose-600",
  },
  yatra: {
    name: "Yatra",
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200",
    accent: "bg-orange-600",
  },
};

export function getPlatformMeta(source: string, sourceType: "airline" | "ota") {
  const key = source.toLowerCase().trim();
  const found = PLATFORM_CONFIG[key];
  if (found) return found;

  const prettyName =
    source.charAt(0).toUpperCase() + source.slice(1) + (sourceType === "airline" ? " Direct" : "");
  return {
    name: prettyName,
    bg: sourceType === "airline" ? "bg-sky-50" : "bg-slate-100",
    text: sourceType === "airline" ? "text-sky-800" : "text-slate-800",
    border: sourceType === "airline" ? "border-sky-200" : "border-slate-200",
    accent: sourceType === "airline" ? "bg-sky-600" : "bg-slate-600",
  };
}

export default function PlatformBadge({
  source,
  sourceType,
  isBest = false,
  className = "",
  size = "md",
}: PlatformBadgeProps) {
  const meta = getPlatformMeta(source, sourceType);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-all ${
        meta.bg
      } ${meta.border} ${meta.text} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${isBest ? "ring-2 ring-emerald-500/30 shadow-xs" : ""} ${className}`}
    >
      {sourceType === "airline" ? (
        <Building2 className={`${size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} shrink-0`} />
      ) : (
        <Globe className={`${size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} shrink-0`} />
      )}
      <span className="font-semibold">{meta.name}</span>
      <span
        className={`rounded px-1 text-[9px] font-bold uppercase tracking-wider ${
          sourceType === "airline"
            ? "bg-blue-200/60 text-blue-900"
            : "bg-slate-200/80 text-slate-700"
        }`}
      >
        {sourceType === "airline" ? "Airline" : "OTA"}
      </span>
      {isBest && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white shadow-xs">
          <Sparkles className="h-2.5 w-2.5" />
          BEST
        </span>
      )}
    </div>
  );
}
