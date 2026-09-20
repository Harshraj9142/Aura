"use client";

import React from "react";

interface DashboardClosingBannerProps {
  quote: string;
  subtitle?: string;
  className?: string;
}

export function DashboardClosingBanner({
  quote,
  subtitle = "REAL-TIME AIRFARE INTELLIGENCE • TIME-SERIES CORRIDOR INDICES • AURA API",
  className = "",
}: DashboardClosingBannerProps) {
  // Helper to split quote into 2 chic stacked typography lines (Neue-Montreal / Helvetica display style)
  const getQuoteLines = (text: string): string[] => {
    const trimmed = text.trim();

    // Check if separated by dot e.g. "THOUSANDS OF FARES. ONE CLEARER PICTURE."
    const dotParts = trimmed
      .split(".")
      .map((s) => s.trim())
      .filter(Boolean);

    if (dotParts.length > 1) {
      return dotParts.map((p) => (p.endsWith(".") ? p : p + "."));
    }

    const words = trimmed.split(/\s+/);
    if (words.length <= 2) {
      return [trimmed];
    }

    if (words.length === 3 || words.length === 4) {
      const splitIdx = words.length === 4 ? 3 : 2;
      return [words.slice(0, splitIdx).join(" "), words.slice(splitIdx).join(" ")];
    }

    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  };

  const lines = getQuoteLines(quote);

  // Normalize subtitle to uppercase clean bullet separation
  const formattedSubtitle = (subtitle || "REAL-TIME AIRFARE INTELLIGENCE • TIME-SERIES CORRIDOR INDICES • AURA API")
    .replace(/·/g, "•")
    .toUpperCase();

  return (
    <div
      className={`relative w-full py-10 sm:py-14 px-6 sm:px-10 lg:px-14 xl:px-16 overflow-hidden flex flex-col items-start justify-center select-none pointer-events-none my-6 ${className}`}
    >
      {lines.map((line, idx) => (
        <h2
          key={idx}
          className="text-5xl sm:text-7xl lg:text-[110px] xl:text-[128px] font-black tracking-tighter text-slate-950/25 dark:text-white/20 leading-[0.88] uppercase font-sans select-none"
        >
          {line}
        </h2>
      ))}
      <p className="mt-4 sm:mt-5 text-[10px] sm:text-xs font-mono font-extrabold tracking-[0.25em] sm:tracking-[0.3em] text-slate-800/60 dark:text-slate-400/50 uppercase select-none">
        {formattedSubtitle}
      </p>
    </div>
  );
}

export default DashboardClosingBanner;
