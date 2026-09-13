"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, LogIn, LogOut, User, Code, Settings } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import ScraperControlModal from "@/components/ScraperControlModal";

interface HeaderProps {
  onRunScraper?: () => void;
  scraperLoading?: boolean;
}

export default function Header({ onRunScraper, scraperLoading }: HeaderProps) {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(scraperLoading || false);
  const { data: session, status } = useSession();

  const userRole = (session?.user as any)?.role || "CITIZEN";

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

  const allNavLinks = [
    { name: "Price Index", href: "/dashboard", roles: ["GOVERNMENT", "CITIZEN"] },
    { name: "Platform Compare", href: "/dashboard/comparison", roles: ["GOVERNMENT"] },
    { name: "Predictions (ML)", href: "/dashboard/predictions", roles: ["CITIZEN", "GOVERNMENT"] },
    { name: "Corridor Trends", href: "/dashboard/trends", roles: ["GOVERNMENT"] },
    { name: "Route Heatmap", href: "/dashboard/heatmap", roles: ["GOVERNMENT"] },
    { name: "Lead-Time Elasticity", href: "/dashboard/elasticity", roles: ["GOVERNMENT"] },
    { name: "Customer Grievance", href: "/dashboard/grievance", roles: ["CITIZEN", "GOVERNMENT"] },
    { name: "Fares Explorer", href: "/dashboard/fares", roles: ["GOVERNMENT"] },
  ];

  const navLinks = allNavLinks.filter(link => link.roles.includes(userRole));

  return (
    <>
      {/* 
        Full Viewport Width Header:
        Spans 100% width across the entire viewport edge-to-edge.
      */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-5 pb-3 font-body transition-all duration-300">
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between px-4 lg:px-6 xl:px-8">
          {/* Left: Brand Logo */}
          <Link href="/" className="group flex items-center gap-2 shrink-0 mr-4 xl:mr-8">
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
          <nav className="hidden lg:flex items-center justify-center flex-1 gap-3 xl:gap-5 text-[11px] xl:text-xs font-semibold text-slate-200 drop-shadow-md whitespace-nowrap mx-2">
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

          {/* Right Action: White Pill Scrape Button & Auth */}
          <div className="shrink-0 flex items-center gap-2 xl:gap-3 ml-4 xl:ml-8">
            {userRole === "GOVERNMENT" && (
              <>
                <Link
                  href="/dashboard/api-docs"
                  className="flex items-center gap-1.5 rounded-full bg-slate-800/50 backdrop-blur-md border border-white/10 px-3 py-1.5 xl:px-4 xl:py-2 text-[10px] xl:text-xs font-bold text-white shadow-lg hover:bg-slate-700/50 active:scale-95 transition cursor-pointer whitespace-nowrap"
                >
                  <Code className="h-3 w-3 xl:h-3.5 xl:w-3.5 text-blue-400" />
                  <span>API Docs</span>
                </Link>
                <Link
                  href="/dashboard/api-keys"
                  className="flex items-center gap-1.5 rounded-full bg-slate-800/50 backdrop-blur-md border border-white/10 px-3 py-1.5 xl:px-4 xl:py-2 text-[10px] xl:text-xs font-bold text-white shadow-lg hover:bg-slate-700/50 active:scale-95 transition cursor-pointer whitespace-nowrap"
                  title="API Keys"
                >
                  <Settings className="h-3 w-3 xl:h-3.5 xl:w-3.5 text-slate-300" />
                </Link>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 xl:px-4 xl:py-2 text-[10px] xl:text-xs font-bold text-[#08080D] shadow-lg hover:bg-slate-100 active:scale-95 transition cursor-pointer whitespace-nowrap"
                >
                  <Zap className="h-3 w-3 xl:h-3.5 xl:w-3.5 text-indigo-600" />
                  <span>Scrape</span>
                </button>
              </>
            )}

            {status === "authenticated" ? (
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 rounded-full bg-slate-800/50 backdrop-blur-md border border-white/10 px-3 py-1.5 xl:px-4 xl:py-2 text-[10px] xl:text-xs font-bold text-white shadow-lg hover:bg-slate-700/50 active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                <LogOut className="h-3 w-3 xl:h-3.5 xl:w-3.5" />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={() => signIn()}
                className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 xl:px-4 xl:py-2 text-[10px] xl:text-xs font-bold text-white shadow-lg hover:bg-indigo-700 active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                <LogIn className="h-3 w-3 xl:h-3.5 xl:w-3.5" />
                <span>Sign In</span>
              </button>
            )}
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
