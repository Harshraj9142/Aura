"use client";

import Header from "@/components/Header";
import LiveScraperTerminal from "@/components/LiveScraperTerminal";
import { Terminal, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ConsolePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <Terminal className="w-6 h-6 text-emerald-400" />
                Live Scraper Terminal & Telemetry Console
              </h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                ● LIVE FEED
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Real-time Playwright scraping engine execution logs, bot protection pass telemetry, and PostgreSQL ingestion logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-slate-900 border border-slate-800 text-slate-300 text-xs py-1 px-3 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
              PostgreSQL DB Sync Active
            </Badge>
          </div>
        </div>

        {/* Dedicated Full Terminal Console Component */}
        <div className="py-2">
          <LiveScraperTerminal />
        </div>
      </main>
    </div>
  );
}
