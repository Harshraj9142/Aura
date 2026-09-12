"use client";

import Link from "next/link";
import {
  TrendingUp,
  Cpu,
  Layers,
  ShieldCheck,
  Calendar,
  Compass,
  ArrowRight,
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: <Cpu className="h-6 w-6 text-sky-400" />,
      title: "Laspeyres Index Engine",
      description:
        "Scientifically weighted price-relative index calibrated against official DGCA passenger sector traffic distributions.",
      badge: "Mathematical Precision",
    },
    {
      icon: <Layers className="h-6 w-6 text-indigo-400" />,
      title: "Cross-OTA Price Arbitrage",
      description:
        "Tracks direct airline pricing versus 6 online travel agencies to isolate dynamic markup margins and uncover true base fares.",
      badge: "Real-Time Scrapes",
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-emerald-400" />,
      title: "Lead-Time Elasticity Matrix",
      description:
        "Models fare surges across 0–3, 4–7, 8–14, and 15–30 day advance booking windows to identify optimal ticket purchase timing.",
      badge: "Predictive Analytics",
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-amber-400" />,
      title: "Automated Outlier Guard",
      description:
        "IQR-based statistical filtering flags aberrant scraper artifacts, surge anomalies, and promotional glitches for pure data integrity.",
      badge: "99.8% Data Quality",
    },
    {
      icon: <Calendar className="h-6 w-6 text-purple-400" />,
      title: "Multi-Frequency Aggregation",
      description:
        "Generates independent daily, weekly, and monthly composite indices directly from granular fare records without compounding drift.",
      badge: "Daily 06:00 IST",
    },
    {
      icon: <Compass className="h-6 w-6 text-rose-400" />,
      title: "National Route Coverage",
      description:
        "Full coverage across India's highest-density golden corridors including DEL-BOM, DEL-BLR, BOM-BLR, BOM-GOA, and more.",
      badge: "6 Golden Corridors",
    },
  ];

  return (
    <section id="features-section" className="relative bg-slate-950 py-24 px-6 sm:px-10 lg:px-14 border-t border-slate-900">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-400 uppercase tracking-widest mb-4">
            Intelligence Platform
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Engineered for Domestic Airfare Transparency
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            APIx processes thousands of live flight fare points daily to compute India&apos;s authoritative real-time airfare index benchmark.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/70 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-inner">
                  {f.icon}
                </div>
                <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-mono font-medium text-slate-300 border border-slate-700">
                  {f.badge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        {/* Action Banner */}
        <div className="mt-16 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-950 p-8 sm:p-12 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Ready to explore live airline fare matrices?
            </h3>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-xl">
              Access the full terminal with granular fare records, interactive route heatmaps, and historical trend comparisons.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-white/10 hover:bg-slate-100 active:scale-95 transition-all whitespace-nowrap"
          >
            <span>Launch Dashboard Terminal</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
