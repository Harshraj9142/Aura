"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import ScraperControlModal from "@/components/ScraperControlModal";

interface HeaderProps {
  onRunScraper?: () => void;
  scraperLoading?: boolean;
}

export default function Header({ onRunScraper, scraperLoading }: HeaderProps) {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(scraperLoading || false);

  const handleLaunchScraper = async (params: {
    source: string;
    route: string;
    window: string;
  }) => {
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

  const navLinks = [
    { name: "Price Index", href: "/dashboard" },
    { name: "Platform Compare", href: "/dashboard/comparison" },
    { name: "Predictions (ML)", href: "/dashboard/predictions" },
    { name: "Corridor Trends", href: "/dashboard/trends" },
    { name: "Route Heatmap", href: "/dashboard/heatmap" },
    { name: "Lead-Time Elasticity", href: "/dashboard/elasticity" },
    { name: "Customer Grievance", href: "/dashboard/grievance" },
    { name: "Fares Explorer", href: "/dashboard/fares" },
  ];

  return (
    <>
      {/* 
        Full Viewport Width Header:
        Spans 100% width across the entire viewport edge-to-edge.
      */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-5 pb-3 font-body transition-all duration-300">
        <div className="w-full flex items-center justify-between px-6 sm:px-10 lg:px-14 xl:px-16">
          {/* Left: Brand Logo */}
          <Link href="/" className="group flex items-center gap-2 shrink-0 mr-6 lg:mr-10">
            <svg
              className="h-5 w-5 text-white -rotate-45 transition-transform duration-200 group-hover:scale-105"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="3 3 21 12 3 21 7 12 3 3" />
            </svg>
            <div>
              <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-md">
                AURA
              </span>
            </div>
          </Link>

          {/* Center Navigation Links: Single Line (whitespace-nowrap) & Clean Gap Spacing */}
          <nav className="hidden lg:flex items-center justify-center flex-1 gap-3.5 xl:gap-5 text-xs sm:text-[13px] font-semibold text-slate-200 drop-shadow-md whitespace-nowrap mx-3">
            {navLinks.map((link, idx) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={idx}
                  href={link.href}
                  className={`relative py-1.5 transition-colors whitespace-nowrap ${
                    isActive ? "text-white font-bold" : "hover:text-white"
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white rounded-full shadow-xs" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: White Pill Scrape Button */}
          <div className="shrink-0 flex items-center gap-3 ml-6 lg:ml-10">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-white px-4.5 py-2 text-xs sm:text-sm font-bold text-[#08080D] shadow-lg hover:bg-slate-100 active:scale-95 transition cursor-pointer whitespace-nowrap"
            >
              <Zap className="h-3.5 w-3.5 text-indigo-600" />
              <span>Scrape Data</span>
            </button>
          </div>
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
