"use client";

import React, { useEffect, useRef, useState } from 'react';

const FRAMES_COUNT = 10;
const frames = Array.from({ length: FRAMES_COUNT }, (_, i) => `/frames/frame_${String(i + 1).padStart(2, '0')}.jpg`);

export default function LandingAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeFrame, setActiveFrame] = useState(0);

  useEffect(() => {
    // Preload all frames
    frames.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    let rafId: number;
    let lastCalculatedFrame = -1;

    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const { top, height } = containerRef.current.getBoundingClientRect();
      const maxScroll = height - window.innerHeight;
      
      const scrollY = -top;
      let progress = scrollY / (maxScroll || 1);
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      const newIndex = Math.min(FRAMES_COUNT - 1, Math.floor(progress * FRAMES_COUNT));

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (newIndex !== lastCalculatedFrame) {
          setActiveFrame(newIndex);
          lastCalculatedFrame = newIndex;
        }

        if (contentRef.current) {
          const opacity = Math.max(0, 1 - progress * 3.5);
          contentRef.current.style.opacity = opacity.toString();
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[120vh] bg-[#05070c] rounded-2xl overflow-hidden border border-slate-800 mb-6">
      <style>{`
        .landing-stage {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 8vh 24px 0;
          text-align: center;
        }

        .landing-eyebrow {
          display: flex;
          align-items: center;
          gap: 9px;
          font-family: monospace;
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          color: #94a3b8;
          margin-bottom: 14px;
        }

        .landing-wordmark {
          position: relative;
          font-weight: 800;
          font-size: clamp(2.4rem, 6vw, 4.5rem);
          letter-spacing: -0.03em;
          color: #f8fafc;
          line-height: 1;
          text-shadow: 0 4px 30px rgba(0,0,0,0.7);
        }

        .landing-wordmark .x {
          color: #10b981;
          text-shadow: 0 0 25px rgba(16,185,129,0.5);
        }

        .landing-tagline {
          margin-top: 12px;
          font-family: monospace;
          font-size: clamp(0.7rem, 1.2vw, 0.82rem);
          letter-spacing: 0.16em;
          color: #94a3b8;
        }
      `}</style>

      <div className="sticky top-0 w-full h-full overflow-hidden">
        {/* IMAGE SEQUENCE */}
        <div className="absolute inset-0 z-0 bg-[#05070c]">
          {frames.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`Flight frame ${index + 1}`}
              className={`absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover saturate-[1.05] contrast-[1.04] transition-opacity duration-300 ease-in-out ${
                index <= activeFrame ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>

        {/* OVERLAYS */}
        <div 
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(5,7,12,0.65) 0%, rgba(5,7,12,0.1) 30%, rgba(5,7,12,0.2) 60%, rgba(5,7,12,0.85) 100%),
                         radial-gradient(ellipse 90% 70% at 50% 45%, rgba(5,7,12,0) 40%, rgba(5,7,12,0.45) 100%)`
          }}
        />

        {/* CONTENT */}
          <div className="landing-wordmark">
            API<span className="x">x</span>
          </div>
          
          <div className="landing-tagline">MoSPI / NSO REAL-TIME AVIATION TELEMETRY</div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce opacity-80 z-10 flex flex-col items-center pointer-events-none">
            <span className="text-white/70 text-xs mb-1 font-mono uppercase tracking-widest">Scroll to explore</span>
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>
  );
}
