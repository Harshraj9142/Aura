"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, Settings } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";

interface HeaderProps {
  onRunScraper?: () => void;
  scraperLoading?: boolean;
}

export default function Header({ onRunScraper, scraperLoading }: HeaderProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const allNavLinks = [
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
    <header className="fixed top-0 left-0 right-0 z-50 pt-5 pb-3 font-body transition-all duration-300">
      <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between px-4 lg:px-6 xl:px-8">
        {/* Left: Brand Logo */}
        <Link href="/" className="group flex items-center gap-2.5 shrink-0 mr-4">
          <svg
            className="h-6 w-6 text-white -rotate-45 transition-transform duration-200 group-hover:scale-105"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <polygon points="3 3 21 12 3 21 7 12 3 3" />
          </svg>
          <div>
            <span className="font-display text-2xl font-bold tracking-tight text-white drop-shadow-md">
              AURA
            </span>
          </div>
        </Link>

        {/* Center: 8 Navigation Tabs (Clean, Spacious, Larger Font Size) */}
        <nav className="hidden lg:flex items-center justify-center flex-1 gap-4 xl:gap-6 text-xs xl:text-sm font-semibold text-slate-200 drop-shadow-md whitespace-nowrap mx-4">
          {allNavLinks.map((link, idx) => {
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

        {/* Right: Settings & Logout Buttons */}
        <div className="shrink-0 flex items-center gap-3 ml-4">
          <Link
            href="/dashboard/api-keys"
            className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-800/50 backdrop-blur-md border border-white/10 text-slate-200 shadow-lg hover:bg-slate-700/50 hover:text-white active:scale-95 transition cursor-pointer"
            title="Settings & API Keys"
          >
            <Settings className="h-4 w-4" />
          </Link>

          {status === "authenticated" ? (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 rounded-full bg-slate-800/50 backdrop-blur-md border border-white/10 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-slate-700/50 active:scale-95 transition cursor-pointer whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          ) : (
            <button
              onClick={() => signIn()}
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-indigo-700 active:scale-95 transition cursor-pointer whitespace-nowrap"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
