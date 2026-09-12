/**
 * Sidebar navigation — links to all dashboard pages
 * with active state indicator.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Fares",
    href: "/dashboard/fares",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    label: "Trends",
    href: "/dashboard/trends",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    label: "Heatmap",
    href: "/dashboard/heatmap",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: "Elasticity",
    href: "/dashboard/elasticity",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    label: "Predictions",
    href: "/dashboard/predictions",
    badge: "ML v2",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  {
    label: "Console",
    href: "/dashboard/console",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-black/5 bg-white font-body">
      {/* Logo */}
      <Link href="/" className="flex h-20 items-center gap-3 border-b border-black/5 px-6 hover:opacity-80 transition">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#08080D] text-white font-bold text-sm">
          A
        </div>
        <div>
          <h1 className="font-heading text-lg font-bold tracking-tight text-[#08080D]">
            Aura <span className="text-xs text-[#08080D]/60 uppercase tracking-widest">APIx</span>
          </h1>
          <p className="text-[10px] -mt-0.5 font-medium text-[#08080D]/60 tracking-wider uppercase">
            Airfare Price Index
          </p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col gap-1.5 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold
                transition-all duration-150
                ${
                  isActive
                    ? "bg-[#08080D] text-white shadow-xs"
                    : "text-[#08080D]/70 hover:bg-[#F3F6F7] hover:text-[#08080D]"
                }
              `}
            >
              <span
                className={
                  isActive
                    ? "text-white"
                    : "text-[#08080D]/60"
                }
              >
                {item.icon}
              </span>
              {item.label}
<<<<<<< Updated upstream
              {item.badge && (
                <span className="ml-auto rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/20">
                  {item.badge}
                </span>
              )}
              {isActive && !item.badge && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
=======
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
>>>>>>> Stashed changes
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-black/5 p-5">
        <p className="text-xs text-[#08080D]/60 font-semibold">
          India Domestic Routes
        </p>
        <p className="text-[11px] text-[#08080D]/50 font-mono mt-0.5">
          Data updated daily at 06:00 IST
        </p>
      </div>
    </aside>
  );
}
