"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plane,
  TrendingDown,
  Sparkles,
  Play,
  Pause,
} from "lucide-react";

interface CorridorPreview {
  id: string;
  route: string;
  airline: string;
  fare: string;
  badge: string;
  trend: string;
}

const corridors: CorridorPreview[] = [
  {
    id: "01",
    route: "DEL → BOM",
    airline: "IndiGo 6E-205",
    fare: "₹4,299",
    badge: "Fastest Corridor",
    trend: "-14% vs 7d avg",
  },
  {
    id: "02",
    route: "DEL → BLR",
    airline: "Air India AI-506",
    fare: "₹5,450",
    badge: "Tech Corridor",
    trend: "-8% vs 7d avg",
  },
  {
    id: "03",
    route: "BOM → GOA",
    airline: "Akasa Air QP-112",
    fare: "₹2,890",
    badge: "Best Weekend Deal",
    trend: "-24% lowest fare",
  },
  {
    id: "04",
    route: "BOM → BLR",
    airline: "IndiGo 6E-448",
    fare: "₹3,920",
    badge: "High Frequency",
    trend: "+2% stable",
  },
  {
    id: "05",
    route: "DEL → CCU",
    airline: "SpiceJet SG-263",
    fare: "₹4,680",
    badge: "Eastern Sector",
    trend: "-11% drop",
  },
  {
    id: "06",
    route: "BLR → GOA",
    airline: "AIX Connect IX-773",
    fare: "₹2,490",
    badge: "Flash Deal",
    trend: "-19% drop",
  },
  {
    id: "07",
    route: "DEL → HYD",
    airline: "Air India AI-839",
    fare: "₹4,150",
    badge: "Business Shuttle",
    trend: "-5% vs avg",
  },
  {
    id: "08",
    route: "BOM → HYD",
    airline: "IndiGo 6E-712",
    fare: "₹3,299",
    badge: "Evening Prime",
    trend: "-12% drop",
  },
];

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCorridorIndex, setActiveCorridorIndex] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Scroll-driven video scrubbing
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !videoRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;

      if (totalScrollable <= 0) return;

      // Calculate progress between 0 and 1
      const progress = Math.min(Math.max(-rect.top / totalScrollable, 0), 1);
      setScrollProgress(progress);

      // Only scrub video via scroll if user hasn't toggled manual playback
      if (!isPlaying && videoRef.current.duration) {
        const targetTime = progress * videoRef.current.duration;
        if (!isNaN(targetTime) && isFinite(targetTime)) {
          videoRef.current.currentTime = targetTime;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleNextCorridor = () => {
    setActiveCorridorIndex((prev) => (prev + 1) % corridors.length);
  };

  const handlePrevCorridor = () => {
    setActiveCorridorIndex((prev) => (prev - 1 + corridors.length) % corridors.length);
  };

  const scrollToContent = () => {
    const nextSection = document.getElementById("features-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({
        top: window.innerHeight * 1.5,
        behavior: "smooth",
      });
    }
  };

  const currentCorridor = corridors[activeCorridorIndex];

  // Dynamic opacity and translation based on scroll progress
  const headlineOpacity = Math.max(1 - scrollProgress * 1.6, 0);
  const headlineTransform = `translateY(-${scrollProgress * 60}px) scale(${1 - scrollProgress * 0.08})`;
  const hudOpacity = Math.min(Math.max((scrollProgress - 0.25) * 2, 0), 1);

  return (
    <section ref={containerRef} className="relative h-[250vh] bg-slate-950 text-white">
      {/* Sticky Fullscreen Video Canvas */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        {/* Background Video Layer */}
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            src="/landing/hero.mp4"
            playsInline
            muted
            loop
            preload="auto"
            onLoadedMetadata={() => setVideoLoaded(true)}
            className="h-full w-full object-cover object-center scale-[1.03] transition-transform duration-700 ease-out"
          />

          {/* Cinematic atmospheric overlays matching the reference aesthetic */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/70" />
          <div className="absolute inset-0 bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-transparent via-slate-950/20 to-slate-950/80" />
        </div>

        {/* Top spacer for fixed header */}
        <div className="h-24 w-full z-10" />

        {/* Center Hero Content (exact replica of user's reference) */}
        <div
          className="relative z-10 mx-auto max-w-5xl px-6 text-center transition-all duration-300 ease-out"
          style={{
            opacity: headlineOpacity,
            transform: headlineTransform,
            pointerEvents: headlineOpacity < 0.1 ? "none" : "auto",
          }}
        >
          {/* Primary Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
            Fly Smarter,
            <br />
            Explore Further.
          </h1>

          {/* Subtitle description */}
          <p className="mx-auto mt-6 max-w-2xl text-sm sm:text-base md:text-lg text-slate-200/90 font-medium leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Elevate your journey with intelligent travel that takes you farther, faster, and with unmatched ease.
          </p>

          {/* Center Pill Button: Get Ticket Now */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="group relative inline-flex items-center gap-3 rounded-full bg-white px-8 py-3.5 text-sm font-extrabold text-slate-950 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:bg-slate-100 hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] active:scale-95 transition-all duration-300"
            >
              <span>Get Ticket Now</span>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white group-hover:translate-x-1 transition-transform">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          </div>
        </div>

        {/* Floating Side Cards (inspired by floating flight thumbnails in the image) */}
        <div
          className="hidden xl:block absolute left-8 top-1/2 -translate-y-1/2 z-10 w-64 space-y-4 transition-all duration-500"
          style={{
            opacity: Math.max(0.85 - scrollProgress * 1.5, 0),
            transform: `translateY(${-scrollProgress * 40}px)`,
            pointerEvents: headlineOpacity < 0.2 ? "none" : "auto",
          }}
        >
          {/* Left Card 1 */}
          <div className="group rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-xl shadow-2xl transition hover:border-white/30 hover:bg-white/15">
            <div className="flex items-center justify-between text-xs text-sky-300 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Plane className="h-3.5 w-3.5" /> DEL → BOM
              </span>
              <span className="text-[10px] rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 border border-emerald-500/30">
                -14%
              </span>
            </div>
            <div className="text-lg font-extrabold text-white">₹4,299</div>
            <div className="text-[11px] text-slate-300">Fastest Golden Corridor</div>
          </div>

          {/* Left Card 2 */}
          <div className="group rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-xl shadow-2xl transition hover:border-white/30 hover:bg-white/15">
            <div className="flex items-center justify-between text-xs text-sky-300 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Plane className="h-3.5 w-3.5" /> DEL → BLR
              </span>
              <span className="text-[10px] text-slate-300">Direct</span>
            </div>
            <div className="text-lg font-extrabold text-white">₹5,450</div>
            <div className="text-[11px] text-slate-300">Tech Corridor Daily Flight</div>
          </div>
        </div>

        {/* Floating Right Cards */}
        <div
          className="hidden xl:block absolute right-8 top-1/2 -translate-y-1/2 z-10 w-64 space-y-4 transition-all duration-500"
          style={{
            opacity: Math.max(0.85 - scrollProgress * 1.5, 0),
            transform: `translateY(${-scrollProgress * 40}px)`,
            pointerEvents: headlineOpacity < 0.2 ? "none" : "auto",
          }}
        >
          {/* Right Card 1 */}
          <div className="group rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-xl shadow-2xl transition hover:border-white/30 hover:bg-white/15">
            <div className="flex items-center justify-between text-xs text-sky-300 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Plane className="h-3.5 w-3.5" /> BOM → GOA
              </span>
              <span className="text-[10px] rounded bg-purple-500/20 text-purple-300 px-1.5 py-0.5 border border-purple-500/30">
                Weekend
              </span>
            </div>
            <div className="text-lg font-extrabold text-white">₹2,890</div>
            <div className="text-[11px] text-slate-300">Coastal Route Low Fare</div>
          </div>

          {/* Right Card 2 */}
          <div className="group rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-xl shadow-2xl transition hover:border-white/30 hover:bg-white/15">
            <div className="flex items-center justify-between text-xs text-sky-300 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Plane className="h-3.5 w-3.5" /> BLR → GOA
              </span>
              <span className="text-[10px] rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 border border-emerald-500/30">
                -19%
              </span>
            </div>
            <div className="text-lg font-extrabold text-white">₹2,490</div>
            <div className="text-[11px] text-slate-300">Flash Price Drop Detected</div>
          </div>
        </div>

        {/* Flight HUD Overlay (Appears as user scrolls into the video) */}
        <div
          className="absolute inset-x-6 top-1/3 z-10 mx-auto max-w-2xl rounded-2xl border border-white/20 bg-slate-950/70 p-6 backdrop-blur-2xl transition-all duration-300 shadow-2xl"
          style={{
            opacity: hudOpacity,
            transform: `translateY(${(1 - hudOpacity) * 30}px) scale(${0.95 + hudOpacity * 0.05})`,
            pointerEvents: hudOpacity > 0.4 ? "auto" : "none",
          }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                Aura Flight Telemetry
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Scroll Progress: {Math.round(scrollProgress * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-400 font-medium">Selected Sector</div>
              <div className="mt-1 text-xl font-extrabold font-mono text-white">
                {currentCorridor.route}
              </div>
              <div className="text-[11px] text-sky-400">{currentCorridor.airline}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Real-Time Fare</div>
              <div className="mt-1 text-2xl font-black font-mono text-emerald-400">
                {currentCorridor.fare}
              </div>
              <div className="text-[11px] text-emerald-300/80">{currentCorridor.trend}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Index Status</div>
              <div className="mt-1 text-xl font-extrabold font-mono text-white">102.4</div>
              <div className="text-[11px] text-slate-400">Weighted Laspeyres</div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-xs font-bold text-white hover:bg-sky-400 transition"
            >
              <span>Explore Route in Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Bottom Bar matching exact layout from reference image */}
        <div className="relative z-20 pb-8 px-6 sm:px-10 lg:px-14">
          <div className="flex items-end justify-between">
            {/* Bottom Left: Avatar Stack & Experience Travel caption */}
            <div className="flex items-center gap-3.5">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 bg-gradient-to-tr from-amber-500 to-orange-400 text-[11px] font-bold text-white shadow-md">
                  JD
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 bg-gradient-to-tr from-sky-500 to-indigo-600 text-[11px] font-bold text-white shadow-md">
                  AR
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 bg-gradient-to-tr from-rose-500 to-pink-500 text-[11px] font-bold text-white shadow-md">
                  SK
                </div>
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-white tracking-tight">Experience Travel,</p>
                <p className="text-[11px] font-medium text-slate-400">Simplified Just for You.</p>
              </div>
            </div>

            {/* Bottom Center: Circular Down Arrow Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={scrollToContent}
                className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/90 text-white border border-white/20 shadow-2xl backdrop-blur-md hover:bg-white hover:text-slate-950 active:scale-95 transition-all duration-300"
                aria-label="Scroll down"
              >
                <ArrowDown className="h-5 w-5 transition-transform duration-300 group-hover:translate-y-0.5" />
                <span className="absolute inset-0 rounded-full border border-white/30 animate-ping pointer-events-none opacity-40" />
              </button>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Scroll to Fly
              </span>
            </div>

            {/* Bottom Right: Route corridor carousel & Video playback toggle */}
            <div className="flex items-center gap-3">
              {/* Play/Pause Video Scrub Toggle */}
              <button
                onClick={togglePlay}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-md hover:bg-black/60 transition"
                title={isPlaying ? "Pause auto-loop" : "Play auto-loop"}
                aria-label="Toggle playback"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
              </button>

              {/* Corridor Navigator < 01 / 08 > */}
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 backdrop-blur-md">
                <button
                  onClick={handlePrevCorridor}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-slate-300 hover:bg-white/20 hover:text-white transition"
                  aria-label="Previous corridor"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono text-xs font-bold text-white px-1">
                  {currentCorridor.id} <span className="text-slate-500">/</span> 08
                </span>
                <button
                  onClick={handleNextCorridor}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-slate-300 hover:bg-white/20 hover:text-white transition"
                  aria-label="Next corridor"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Progress Bar at the very bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 transition-all duration-75"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
