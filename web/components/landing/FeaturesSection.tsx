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

import { HowItWorksCarousel } from "@/components/landing/HowItWorksCarousel";

export function FeaturesSection() {
  const features = [
    {
      icon: <Cpu className="h-6 w-6 text-[#08080D]" />,
      title: "Laspeyres Index Engine",
      description:
        "Scientifically weighted price-relative index calibrated against official DGCA passenger sector traffic distributions.",
      badge: "Mathematical Precision",
    },
    {
      icon: <Layers className="h-6 w-6 text-[#08080D]" />,
      title: "Cross-OTA Price Arbitrage",
      description:
        "Tracks direct airline pricing versus 6 online travel agencies to isolate dynamic markup margins and uncover true base fares.",
      badge: "Real-Time Scrapes",
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-[#08080D]" />,
      title: "Lead-Time Elasticity Matrix",
      description:
        "Models fare surges across 0–3, 4–7, 8–14, and 15–30 day advance booking windows to identify optimal ticket purchase timing.",
      badge: "Predictive Analytics",
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-[#08080D]" />,
      title: "Automated Outlier Guard",
      description:
        "IQR-based statistical filtering flags aberrant scraper artifacts, surge anomalies, and promotional glitches for pure data integrity.",
      badge: "99.8% Data Quality",
    },
    {
      icon: <Calendar className="h-6 w-6 text-[#08080D]" />,
      title: "Multi-Frequency Aggregation",
      description:
        "Generates independent daily, weekly, and monthly composite indices directly from granular fare records without compounding drift.",
      badge: "Daily 06:00 IST",
    },
    {
      icon: <Compass className="h-6 w-6 text-[#08080D]" />,
      title: "National Route Coverage",
      description:
        "Full coverage across India's highest-density golden corridors including DEL-BOM, DEL-BLR, BOM-BLR, BOM-GOA, and more.",
      badge: "6 Golden Corridors",
    },
  ];

  const testimonials = [
    {
      quote:
        "Aura's real-time airfare index gave our corporate travel desk unprecedented clarity on booking lead times. We optimized our quarterly flight expenditure by over 18%.",
      author: "Rajesh Sharma",
      role: "VP of Operations, Nexus Logistics",
    },
    {
      quote:
        "The cross-OTA arbitrage tracking and lead-time elasticity matrix is a game-changer for monitoring airline yield management strategy across India's golden corridors.",
      author: "Ananya Iyer",
      role: "Aviation Analyst, Skybound Research",
    },
  ];

  return (
    <section id="features-section" className="relative bg-[#F3F6F7] py-24 px-6 sm:px-10 lg:px-14 border-t border-black/5">
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#08080D]/10 bg-[#08080D]/5 px-4 py-1 text-xs font-semibold text-[#08080D] uppercase tracking-widest mb-4">
            Intelligence Platform
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#08080D]">
            Engineered for Domestic Airfare Transparency
          </h2>
          <p className="font-body mt-4 text-base sm:text-lg text-[#08080D]/70 leading-relaxed">
            APIx processes thousands of live flight fare points daily to compute India&apos;s authoritative real-time airfare index benchmark.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative rounded-3xl border border-black/5 bg-white p-7 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="rounded-2xl bg-[#F3F6F7] p-3 text-[#08080D]">
                  {f.icon}
                </div>
                <span className="rounded-full bg-[#F3F6F7] px-3 py-1 text-[11px] font-semibold text-[#08080D]/80 border border-black/5">
                  {f.badge}
                </span>
              </div>
              <h3 className="font-heading text-lg font-bold text-[#08080D]">
                {f.title}
              </h3>
              <p className="font-body mt-2.5 text-sm text-[#08080D]/70 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        {/* How It Works Procedure Section */}
        <div className="mt-16 sm:mt-20">
          <HowItWorksCarousel />
        </div>

        {/* Action Banner */}
        <div className="mt-20 rounded-3xl bg-[#08080D] p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div>
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-white">
              Ready to explore live airline fare matrices?
            </h3>
            <p className="font-body mt-2 text-sm sm:text-base text-white/80 max-w-xl">
              Access the full terminal with granular fare records, interactive route heatmaps, and historical trend comparisons.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#08080D] hover:bg-[#F3F6F7] active:scale-95 transition-all whitespace-nowrap"
          >
            <span>Launch Dashboard Terminal</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
