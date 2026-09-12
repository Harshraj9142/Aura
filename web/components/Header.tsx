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
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-black">
              <Plane className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-slate-950 font-black text-lg leading-none tracking-tight">APIx</h1>
                <Badge variant="outline" className="text-[10px] uppercase py-0 px-1.5 border-indigo-200 text-indigo-900 bg-indigo-50 font-bold">
                  MoSPI Govt
                </Badge>
              </div>
              <p className="text-slate-600 text-xs font-medium tracking-wide mt-0.5">
                Real-time Airfare Price Index for India
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 font-mono text-xs">
            <Link href="/dashboard" className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors font-bold">
              Dashboard
            </Link>
            <Link href="/dashboard/console" className="px-2.5 py-1 rounded-lg text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-emerald-700" />
              <span>Console</span>
            </Link>
            <Link href="/dashboard/trends" className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors font-bold">
              Trends
            </Link>
            <Link href="/dashboard/heatmap" className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors font-bold">
              Heatmap
            </Link>
            <Link href="/dashboard/elasticity" className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors font-bold">
              Elasticity
            </Link>
            <Link href="/dashboard/fares" className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors font-bold">
              Fares
            </Link>
          </nav>

          {/* Action button */}
          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-bold border-slate-300 hover:bg-slate-50 text-slate-900 bg-white shadow-xs"
          >
            {loading ? (
              <>
                <Activity className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Scraping Data...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
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
