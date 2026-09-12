"use client";

import { useEffect, useRef, useState } from "react";

interface FrameMeta {
  frame: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SpriteSheetMeta {
  totalFrames: number;
  cols: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
  sheetWidth: number;
  sheetHeight: number;
  frames: FrameMeta[];
}

export function SpriteAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Animation state refs (to avoid re-renders inside requestAnimationFrame)
  const imageRef = useRef<HTMLImageElement | null>(null);
  const metaRef = useRef<SpriteSheetMeta | null>(null);
  const targetFrameRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const renderedFrameRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);

  // 1. Load sprite sheet and metadata
  useEffect(() => {
    let active = true;

    async function loadAssets() {
      try {
        const metaRes = await fetch("/landing/aircraft_spritesheet.json");
        if (!metaRes.ok) throw new Error("Failed to load metadata");
        const metadata: SpriteSheetMeta = await metaRes.json();

        if (!active) return;
        metaRef.current = metadata;

        const img = new Image();
        img.src = "/landing/aircraft_spritesheet.webp";

        img.onload = () => {
          if (!active) return;
          imageRef.current = img;
          setIsLoaded(true);
        };

        img.onerror = () => {
          // Fallback to PNG if WebP fails
          const pngImg = new Image();
          pngImg.src = "/landing/aircraft_spritesheet.png";
          pngImg.onload = () => {
            if (!active) return;
            imageRef.current = pngImg;
            setIsLoaded(true);
          };
          pngImg.onerror = () => {
            if (!active) return;
            setLoadError(true);
          };
        };
      } catch (err) {
        console.error("Error loading sprite sheet:", err);
        if (active) setLoadError(true);
      }
    }

    loadAssets();

    return () => {
      active = false;
    };
  }, []);

  // 2. Draw frame onto canvas with cover aspect ratio
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const meta = metaRef.current;
    if (!canvas || !img || !meta) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const clampedIndex = Math.min(Math.max(Math.round(frameIndex), 0), meta.totalFrames - 1);
    const frame = meta.frames[clampedIndex];
    if (!frame) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const fw = frame.w;
    const fh = frame.h;

    // Aspect ratio "cover" calculations with zoom to fit
    const canvasRatio = cw / ch;
    const frameRatio = fw / fh;

    // Zoom factor to fill and position the aircraft in the lower third
    const ZOOM = 1.05;
    let dw = cw;
    let dh = ch;
    let dx = 0;
    let dy = 0;

    if (canvasRatio > frameRatio) {
      dw = cw * ZOOM;
      dh = (cw / frameRatio) * ZOOM;
      dx = (cw - dw) / 2;
      // Anchor so the aircraft rests cleanly in the lower portion of the screen
      dy = (ch - dh) * 0.95;
    } else {
      dh = ch * ZOOM;
      dw = (ch * frameRatio) * ZOOM;
      dx = (cw - dw) / 2;
      dy = (ch - dh) * 0.95;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, frame.x, frame.y, frame.w, frame.h, dx, dy, dw, dh);
    renderedFrameRef.current = clampedIndex;
  };

  // 3. Canvas resize handling with devicePixelRatio
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      if (isLoaded) {
        drawFrame(currentFrameRef.current);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isLoaded]);

  // Track scroll progress for smooth text fading
  const [scrollProgress, setScrollProgress] = useState(0);

  // 4. Scroll tracking and ultra-smooth animation loop (lerp)
  useEffect(() => {
    if (!isLoaded) return;

    const handleScroll = () => {
      if (!containerRef.current || !metaRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const totalScroll = containerRef.current.offsetHeight - window.innerHeight;

      if (totalScroll <= 0) return;

      const progress = Math.min(Math.max(-rect.top / totalScroll, 0), 1);
      setScrollProgress(progress);
      targetFrameRef.current = progress * (metaRef.current.totalFrames - 1);
    };

    const animate = () => {
      // Smooth interpolation (lerp factor 0.12 gives silky inertia without noticeable lag)
      const diff = targetFrameRef.current - currentFrameRef.current;

      if (Math.abs(diff) > 0.001) {
        currentFrameRef.current += diff * 0.12;
      } else {
        currentFrameRef.current = targetFrameRef.current;
      }

      const frameToDraw = Math.round(currentFrameRef.current);
      if (frameToDraw !== renderedFrameRef.current) {
        drawFrame(currentFrameRef.current);
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isLoaded]);

  // Gentle fade-out of hero text as plane starts flying
  const heroOpacity = Math.max(1 - scrollProgress * 2.8, 0);
  const heroTranslateY = -scrollProgress * 60;

  // Features section appears while the plane leaves (scrollProgress 0.52 -> 0.82)
  const featuresProgress = Math.min(Math.max((scrollProgress - 0.52) / 0.28, 0), 1);
  const featuresOpacity = featuresProgress;
  const featuresTranslateY = (1 - featuresProgress) * 40;

  return (
    <div ref={containerRef} className="relative h-[420vh] bg-[#e4e9ef] w-full">
      {/* Sticky fullscreen canvas viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between items-center select-none">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover z-0 pointer-events-none" />

        {/* Top Header Bar */}
        <header
          className="relative z-30 w-full max-w-7xl px-6 sm:px-12 pt-6 sm:pt-8 flex items-center justify-between transition-all duration-300 ease-out"
        >
          {/* Brand Logo matching LuxFly */}
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-slate-900 -rotate-45"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="3 3 21 12 3 21 7 12 3 3" fill="currentColor" />
            </svg>
            <span className="font-display text-xl font-bold tracking-tight text-slate-900">
              Aura
            </span>
          </div>

          {/* Top-right dashboard link */}
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="font-display text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
            >
              Dashboard →
            </a>
          </div>
        </header>

        {/* Layer 1: Hero Center Block (Visible at start, fades out as plane accelerates) */}
        <div
          className="relative z-10 mx-auto max-w-4xl px-6 text-center transition-all duration-300 ease-out mt-12 sm:mt-16 md:mt-24 lg:mt-28 flex flex-col items-center mb-auto"
          style={{
            opacity: heroOpacity,
            transform: `translateY(${heroTranslateY}px)`,
            pointerEvents: heroOpacity < 0.1 ? "none" : "auto",
          }}
        >
          {/* Tag Pill: matches "FLIGHT BOOKING" */}
          <div className="inline-flex items-center justify-center rounded-full bg-white/60 px-4 py-1 border border-white/80 shadow-xs mb-4 sm:mb-5">
            <span className="font-display text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] text-slate-600 uppercase">
              AURA — Airfare Price Index
            </span>
          </div>

          {/* Big Center Headline: matches "Fly Smarter, Explore Further." */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-normal tracking-[-0.035em] text-[#1c222b] leading-[1.05]">
            Real-time airfare,
            <br />
            intelligence, indexed.
          </h1>

          {/* Subtext: matches reference subtitle */}
          <p className="font-display mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-500 font-normal tracking-[-0.01em] max-w-lg leading-relaxed">
            Tracking India&apos;s skies, one fare at a time.
          </p>

          {/* CTA Button: matches "Get Ticket Now" */}
          <div className="mt-6 sm:mt-8">
            <a
              href="/dashboard"
              className="font-display group inline-flex items-center gap-2 rounded-full bg-white px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-white/80 hover:bg-slate-50 hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-200"
            >
              <span>Enter</span>
              <span className="text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </a>
          </div>
        </div>

        {/* Layer 2: Features Section (Appears ON TOP OF THE FRAMES as the plane leaves!) */}
        <div
          className="absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out pt-16 pb-8"
          style={{
            opacity: featuresOpacity,
            transform: `translateY(${featuresTranslateY}px)`,
            pointerEvents: featuresOpacity > 0.4 ? "auto" : "none",
          }}
        >
          <div className="w-full max-w-5xl rounded-3xl border border-white/70 bg-white/70 backdrop-blur-2xl p-6 sm:p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] text-slate-900">
            {/* Features Header */}
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/80 px-3.5 py-1 text-[10px] sm:text-xs font-mono font-semibold tracking-wider text-slate-700 uppercase mb-3">
                Intelligence Platform
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-normal tracking-tight text-slate-900">
                Precision Airfare Monitoring, At Scale
              </h2>
              <p className="font-display text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                AURA indexes India&apos;s commercial aviation corridors in real-time, delivering clean statistical benchmarking and elasticity models.
              </p>
            </div>

            {/* 4 Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="rounded-2xl border border-white/80 bg-white/60 p-4 sm:p-5 backdrop-blur-md shadow-xs hover:shadow-md transition">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-sky-600 mb-2">
                  01 / Index Engine
                </div>
                <h3 className="font-display font-semibold text-sm sm:text-base text-slate-900">
                  Laspeyres Benchmark
                </h3>
                <p className="font-display text-xs text-slate-500 mt-1.5 leading-relaxed">
                  DGCA passenger volume-weighted price relatives computed across daily, weekly, and monthly windows.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-2xl border border-white/80 bg-white/60 p-4 sm:p-5 backdrop-blur-md shadow-xs hover:shadow-md transition">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 mb-2">
                  02 / Price Arbitrage
                </div>
                <h3 className="font-display font-semibold text-sm sm:text-base text-slate-900">
                  Multi-OTA Tracking
                </h3>
                <p className="font-display text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Continuous price collection across 5 airlines and 6 OTAs to isolate true base fares from platform markups.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-2xl border border-white/80 bg-white/60 p-4 sm:p-5 backdrop-blur-md shadow-xs hover:shadow-md transition">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 mb-2">
                  03 / Elasticity
                </div>
                <h3 className="font-display font-semibold text-sm sm:text-base text-slate-900">
                  Lead-Time Curves
                </h3>
                <p className="font-display text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Dynamic surge modeling comparing 0–3 day departure windows against 14–30 day advance bookings.
                </p>
              </div>

              {/* Card 4 */}
              <div className="rounded-2xl border border-white/80 bg-white/60 p-4 sm:p-5 backdrop-blur-md shadow-xs hover:shadow-md transition">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-purple-600 mb-2">
                  04 / Data Hygiene
                </div>
                <h3 className="font-display font-semibold text-sm sm:text-base text-slate-900">
                  99.8% Outlier Guard
                </h3>
                <p className="font-display text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Automated IQR statistical validation removes crawler anomalies, promotional glitches, and bad records.
                </p>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="mt-8 pt-6 border-t border-slate-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mr-1">
                  Active Corridors:
                </span>
                <a
                  href="/dashboard/fares?origin=DEL&destination=BOM"
                  className="rounded-full bg-slate-900/5 hover:bg-slate-900/10 px-2.5 py-1 text-xs font-mono font-medium text-slate-700 transition"
                >
                  DEL-BOM
                </a>
                <a
                  href="/dashboard/fares?origin=DEL&destination=BLR"
                  className="rounded-full bg-slate-900/5 hover:bg-slate-900/10 px-2.5 py-1 text-xs font-mono font-medium text-slate-700 transition"
                >
                  DEL-BLR
                </a>
                <a
                  href="/dashboard/fares?origin=BOM&destination=GOA"
                  className="rounded-full bg-slate-900/5 hover:bg-slate-900/10 px-2.5 py-1 text-xs font-mono font-medium text-slate-700 transition"
                >
                  BOM-GOA
                </a>
              </div>

              <a
                href="/dashboard"
                className="font-display group inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-slate-800 transition"
              >
                <span>Launch Dashboard Terminal</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom breathing space to let the jet soar unobstructed */}
        <div className="h-16 w-full pointer-events-none" />

        {/* Loading state indicator */}
        {!isLoaded && !loadError && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#dbe1e8] text-slate-600">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-400 border-t-slate-900" />
            </div>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#dbe1e8] text-rose-500 text-sm">
            Failed to load animation assets.
          </div>
        )}
      </div>
    </div>
  );
}
