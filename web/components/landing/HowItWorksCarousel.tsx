"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Database, Cpu, TrendingUp, ShieldCheck, LineChart, ArrowRight } from "lucide-react";

interface ProcedureStep {
  id: string;
  num: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tag: string;
}

const procedureSteps: ProcedureStep[] = [
  {
    id: "step-1",
    num: "01",
    title: "Multi-Source Fare Scrapers",
    description:
      "Continuous live pricing telemetry collected across 5 major domestic airlines and 6 online travel agencies every 15 minutes to isolate pure base fares from platform markups.",
    icon: <Database className="h-4 w-4" />,
    tag: "Real-time Telemetry",
  },
  {
    id: "step-2",
    num: "02",
    title: "Laspeyres Composite Benchmark",
    description:
      "Scientifically weighted price-relative index calibrated against official DGCA passenger sector traffic distributions across daily, weekly, and monthly windows.",
    icon: <Cpu className="h-4 w-4" />,
    tag: "DGCA Calibrated",
  },
  {
    id: "step-3",
    num: "03",
    title: "Lead-Time Advance Booking Matrix",
    description:
      "Dynamic surge modeling comparing 0–3 day departure windows against 14–30 day advance bookings to identify optimal ticket purchase timing.",
    icon: <TrendingUp className="h-4 w-4" />,
    tag: "Surge Predictive",
  },
  {
    id: "step-4",
    num: "04",
    title: "Automated Outlier Guard",
    description:
      "IQR-based statistical filtering flags aberrant scraper artifacts, surge anomalies, and promotional glitches for pure 99.8% data integrity.",
    icon: <ShieldCheck className="h-4 w-4" />,
    tag: "99.8% Pure Data",
  },
  {
    id: "step-5",
    num: "05",
    title: "CPI Retail Impact Simulation",
    description:
      "Simulates how domestic airfare price surges directly impact India's retail Consumer Price Index (CPI) basket metrics over monthly cycles.",
    icon: <LineChart className="h-4 w-4" />,
    tag: "Macro Analytics",
  },
];

export function HowItWorksCarousel({ isVisible = true }: { isVisible?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0); // Always start from 01 card
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // When not visible yet (e.g. user is on Hero section), hold activeIndex at 0 (Card 01)
  useEffect(() => {
    if (!isVisible) {
      setActiveIndex(0);
    }
  }, [isVisible]);

  // Auto-play timer: ONLY ticks when visible AND isAutoPlaying is true (doubled speed: 1.6s)
  useEffect(() => {
    if (!isVisible || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % procedureSteps.length);
    }, 1600);

    return () => clearInterval(interval);
  }, [isVisible, isAutoPlaying]);

  // Voluntary user interaction halts auto-play
  const handleManualPrev = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev === 0 ? procedureSteps.length - 1 : prev - 1));
  };

  const handleManualNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev === procedureSteps.length - 1 ? 0 : prev + 1));
  };

  const handleManualSelect = (index: number) => {
    setIsAutoPlaying(false);
    setActiveIndex(index);
  };

  // Dimensional math for perfect center sliding:
  // Desktop: card width = 520px, gap = 24px => step = 544px
  // Mobile: card width = 320px, gap = 16px => step = 336px
  const cardWidth = isMobile ? 320 : 520;
  const gap = isMobile ? 16 : 24;
  const stepDistance = cardWidth + gap;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col items-center select-none font-display">
      {/* Category Subhead Tag */}
      <div className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-[#08080D]/60 uppercase mb-2">
        HOW WE INDEX INDIAN SKIES
      </div>

      {/* Main Section Headline */}
      <h2 className="text-3xl sm:text-5xl md:text-6xl font-normal text-[#08080D] tracking-tight text-center leading-[1.08] max-w-2xl mb-8 sm:mb-12">
        Engineered For
        <br />
        <span className="font-semibold text-[#08080D]">Unmatched Precision</span>
      </h2>

      {/* Carousel Track Viewport */}
      <div className="relative w-full overflow-hidden py-6 h-[400px] sm:h-[420px] flex items-center justify-center">
        <div
          className="absolute flex items-center transition-transform duration-250 ease-out"
          style={{
            left: "50%",
            transform: `translateX(calc(-${activeIndex * stepDistance + cardWidth / 2}px))`,
          }}
        >
          {procedureSteps.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <div
                key={item.id}
                onClick={() => handleManualSelect(index)}
                style={{
                  width: `${cardWidth}px`,
                  marginRight: `${gap}px`,
                }}
                className={`shrink-0 min-h-[330px] sm:min-h-[360px] rounded-[28px] p-7 sm:p-9 flex flex-col justify-between cursor-pointer transition-all duration-250 ease-out ${
                  isActive
                    ? "bg-[#08080D] text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] scale-100 opacity-100 z-20 border border-white/10"
                    : "bg-[#D9E1E8] text-[#08080D] scale-95 opacity-40 hover:opacity-60 z-10 border border-black/5"
                }`}
              >
                <div>
                  {/* Card Header: Step Number (Category tag removed as requested) */}
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-sans ${
                        isActive ? "text-white" : "text-[#08080D]/40"
                      }`}
                    >
                      {item.num}
                    </span>
                  </div>

                  {/* Step Title */}
                  <h3
                    className={`font-heading text-xl sm:text-2xl font-bold tracking-tight mb-2.5 ${
                      isActive ? "text-white" : "text-[#08080D]/90"
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Step Description */}
                  <p
                    className={`font-body text-xs sm:text-sm md:text-base leading-relaxed ${
                      isActive ? "text-slate-300 font-normal" : "text-[#08080D]/65 font-normal"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Card Footer: Metadata Tag + CTA */}
                <div
                  className={`mt-6 pt-4 border-t flex items-center justify-between ${
                    isActive ? "border-white/10" : "border-black/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg flex items-center justify-center ${
                        isActive ? "bg-white/10 text-white" : "bg-black/5 text-[#08080D]/70"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        isActive ? "text-white/90" : "text-[#08080D]/70"
                      }`}
                    >
                      {item.tag}
                    </span>
                  </div>

                  <a
                    href="/dashboard"
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      isActive
                        ? "text-white hover:text-white/80"
                        : "text-[#08080D]/70 hover:text-[#08080D]"
                    }`}
                  >
                    <span>Terminal</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls: Circular arrows + step indicators */}
      <div className="mt-4 flex items-center gap-5">
        <button
          onClick={handleManualPrev}
          className="w-11 h-11 rounded-full bg-white border border-black/10 text-[#08080D] shadow-sm flex items-center justify-center hover:bg-[#F3F6F7] active:scale-95 transition-all duration-200 cursor-pointer"
          aria-label="Previous Step"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2 px-2">
          {procedureSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => handleManualSelect(i)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeIndex ? "w-7 bg-[#08080D]" : "w-2.5 bg-black/20 hover:bg-black/40"
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleManualNext}
          className="w-11 h-11 rounded-full bg-white border border-black/10 text-[#08080D] shadow-sm flex items-center justify-center hover:bg-[#F3F6F7] active:scale-95 transition-all duration-200 cursor-pointer"
          aria-label="Next Step"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
