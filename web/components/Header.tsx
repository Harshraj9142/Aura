"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Activity, Plane } from "lucide-react";

interface HeaderProps {
  onRunScraper: () => void;
  scraperLoading: boolean;
}

export default function Header({ onRunScraper, scraperLoading }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            <Plane className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-slate-100 font-bold text-lg leading-none tracking-tight">APIx</h1>
              <Badge variant="outline" className="text-[10px] uppercase py-0 px-1.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                MoSPI Govt
              </Badge>
            </div>
            <p className="text-slate-400 text-xs font-medium tracking-wide mt-0.5">
              Real-time Airfare Price Index for India
            </p>
          </div>
        </div>

        {/* Center Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-300 font-medium">Scraper Pipeline Active</span>
        </div>

        {/* Action button */}
        <Button
          onClick={onRunScraper}
          disabled={scraperLoading}
          variant="outline"
          size="sm"
          className="gap-2 text-xs font-medium border-slate-800 hover:bg-slate-900"
        >
          {scraperLoading ? (
            <>
              <Activity className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Scraping Data...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Run Scraper Now</span>
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
