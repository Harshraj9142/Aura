"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Activity, Plane, Terminal } from "lucide-react";
import ScraperControlModal from "@/components/ScraperControlModal";

interface HeaderProps {
  onRunScraper?: () => void;
  scraperLoading?: boolean;
}

export default function Header({ onRunScraper, scraperLoading }: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(scraperLoading || false);

  const handleLaunchScraper = async (params: { source: string; route: string; window: string }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.message) {
        alert(data.message);
      }
      if (onRunScraper) onRunScraper();
    } catch (err) {
      console.error("Scraper launch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 font-mono text-xs">
            <Link href="/dashboard" className="px-2.5 py-1 rounded text-slate-300 hover:text-emerald-400 hover:bg-slate-900 transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/console" className="px-2.5 py-1 rounded text-emerald-400 font-bold bg-slate-900 border border-slate-800 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Console</span>
            </Link>
            <Link href="/dashboard/trends" className="px-2.5 py-1 rounded text-slate-300 hover:text-emerald-400 hover:bg-slate-900 transition-colors">
              Trends
            </Link>
            <Link href="/dashboard/heatmap" className="px-2.5 py-1 rounded text-slate-300 hover:text-emerald-400 hover:bg-slate-900 transition-colors">
              Heatmap
            </Link>
            <Link href="/dashboard/elasticity" className="px-2.5 py-1 rounded text-slate-300 hover:text-emerald-400 hover:bg-slate-900 transition-colors">
              Elasticity
            </Link>
            <Link href="/dashboard/fares" className="px-2.5 py-1 rounded text-slate-300 hover:text-emerald-400 hover:bg-slate-900 transition-colors">
              Fares
            </Link>
          </nav>

          {/* Action button */}
          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-semibold border-slate-800 hover:bg-slate-900 text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
          >
            {loading ? (
              <>
                <Activity className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Scraping Data...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>⚡ Run Scraper</span>
              </>
            )}
          </Button>
        </div>
      </header>

      <ScraperControlModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLaunch={handleLaunchScraper}
      />
    </>
  );
}
