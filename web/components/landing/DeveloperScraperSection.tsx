"use client";

import React from "react";
import Link from "next/link";
import { Terminal, Code2, ArrowRight } from "lucide-react";

export function DeveloperScraperSection() {
  return (
    <div className="mt-16 sm:mt-20 py-8 text-center space-y-6 max-w-3xl mx-auto">
      <div className="space-y-3">
        <h3 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Developer Tools & Live Scraper Controls
        </h3>
        <p className="font-body text-sm sm:text-base text-white/75 font-normal leading-relaxed">
          Access raw API endpoints, open-source OpenAPI specifications, and initiate real-time Playwright scraper runs across Indian carrier portals.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <Link
          href="/dashboard/scrape"
          className="inline-flex items-center gap-2.5 rounded-full bg-white text-slate-950 hover:bg-slate-100 px-6 py-3 text-xs sm:text-sm font-bold transition shadow-lg cursor-pointer"
        >
          <Terminal className="h-4 w-4 text-purple-600" />
          <span>Live Scraper Control</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          href="/api-docs"
          className="inline-flex items-center gap-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 text-xs sm:text-sm font-bold transition shadow-lg cursor-pointer backdrop-blur-sm"
        >
          <Code2 className="h-4 w-4 text-purple-400" />
          <span>API Documentation</span>
        </Link>
      </div>
    </div>
  );
}

export default DeveloperScraperSection;
