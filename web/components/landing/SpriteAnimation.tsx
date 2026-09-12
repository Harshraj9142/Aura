"use client";

import { useEffect, useRef, useState } from "react";
import { LandingHeader } from "./LandingHeader";
import { HowItWorksCarousel } from "./HowItWorksCarousel";

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

  // Track scroll progress for smooth text fading & canvas frame updates
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

  // Features section appears while the plane leaves (scrollProgress 0.48 -> 0.85)
  const featuresProgress = Math.min(Math.max((scrollProgress - 0.48) / 0.32, 0), 1);
  const featuresOpacity = featuresProgress;
  const featuresTranslateY = (1 - featuresProgress) * 40;

  return (
    <div className="relative w-full bg-[#e4e9ef]">
      {/* 
        Fixed Fullscreen Canvas Background:
        Stays fixed in background z-0 for the entire landing page.
        Once the flight finishes (last frame), this exact final scene remains static 
        as the background for all lower sections.
      */}
      <div className="fixed inset-0 h-screen w-full overflow-hidden pointer-events-none z-0 select-none">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
      </div>

      {/* Fixed Top Header Bar */}
      <LandingHeader />

      {/* Hero Flight Animation & Procedure Carousel Container */}
      <div ref={containerRef} className="relative z-10 w-full h-[360vh] select-none">
        {/* Layer 1: Hero Center Block */}
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-between pointer-events-none">
          <div
            className="mx-auto max-w-4xl px-6 text-center transition-all duration-300 ease-out flex flex-col items-center pt-44 sm:pt-52 md:pt-60 lg:pt-64 pointer-events-auto"
            style={{
              opacity: heroOpacity,
              transform: `translateY(${heroTranslateY}px)`,
              pointerEvents: heroOpacity < 0.1 ? "none" : "auto",
            }}
          >
            <h1 className="font-display-hero text-4xl sm:text-6xl md:text-7xl lg:text-[78px] font-normal text-[#08080D] leading-[1.04]">
              Real-time airfare,
              <br />
              intelligence, indexed.
            </h1>

            <p className="font-body mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-[#08080D]/70 font-normal max-w-lg leading-relaxed">
              Tracking India&apos;s skies, one fare at a time.
            </p>

            <div className="mt-6 sm:mt-8">
              <a
                href="/dashboard"
                className="font-display group inline-flex items-center gap-2 rounded-full bg-[#08080D] px-8 py-3 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#1A1F2B] active:scale-95 transition-all duration-200"
              >
                <span>Enter Terminal</span>
                <span className="text-white/70 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </a>
            </div>
          </div>

          {/* Layer 2: How It Works Carousel */}
          <div
            className="absolute inset-0 z-20 flex items-center justify-center transition-all duration-300 ease-out pt-16 pb-8 overflow-hidden pointer-events-auto"
            style={{
              opacity: featuresOpacity,
              transform: `translateY(${featuresTranslateY}px)`,
              pointerEvents: featuresOpacity > 0.4 ? "auto" : "none",
            }}
          >
            <HowItWorksCarousel isVisible={featuresOpacity > 0.2} />
          </div>
        </div>
      </div>

      {/* Loading state indicator */}
      {!isLoaded && !loadError && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#dbe1e8] text-slate-600">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-400 border-t-slate-900" />
          </div>
        </div>
      )}

      {loadError && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#dbe1e8] text-rose-500 text-sm">
          Failed to load animation assets.
        </div>
      )}
    </div>
  );
}
