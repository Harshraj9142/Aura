import { Metadata } from "next";
import Image from "next/image";
import {
  getModelRegistryStats,
  getRecentPredictions,
  getRealCorridorSummaries,
  getRealTrackedFlights,
} from "@/lib/services/prediction.service";
import { PredictionDashboardClient } from "@/components/predictions/PredictionDashboardClient";

export const metadata: Metadata = {
  title: "AI Price Predictions & Forecasts | AURA",
  description:
    "Continuous-learning ML airfare price prediction and horizon forecasting for domestic Indian aviation corridors.",
};

export const revalidate = 60; // Refresh every minute

export default async function PredictionsPage() {
  const [registryStats, recentPredictions, corridorStats, realFlights] = await Promise.all([
    getModelRegistryStats(),
    getRecentPredictions(25),
    getRealCorridorSummaries(),
    getRealTrackedFlights(12),
  ]);

  return (
    <div className="relative w-full overflow-hidden space-y-0 font-sans">
      
      {/* 
        ========================================================================
        1. HERO PANORAMA BANNER (Identical layout & typography across all tabs)
        - Wide-angle cinematic aviation control tower image (/dashboard/predictions_hero.jpg)
        ========================================================================
      */}
      <div className="relative w-full min-h-[480px] sm:min-h-[520px] lg:min-h-[560px] flex flex-col justify-between pt-36 sm:pt-40 lg:pt-44 pb-20 sm:pb-24 px-6 sm:px-10 lg:px-14 xl:px-16">
        
        {/* Masked Panorama Background Image */}
        <div
          className="absolute inset-0 z-0 bg-slate-950 pointer-events-none"
          style={{
            maskImage:
              "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.85) 65%, rgba(0,0,0,0.3) 85%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.85) 65%, rgba(0,0,0,0.3) 85%, transparent 100%)",
          }}
        >
          <Image
            src="/dashboard/predictions_hero.jpg"
            alt="AI Control Tower Panorama"
            fill
            sizes="100vw"
            className="object-cover object-center scale-[1.02]"
            priority
          />

          {/* Top Black Vignette Gradient Layer */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/95 via-black/60 to-transparent z-10" />

          {/* Left Dark Vignette Layer */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent sm:w-2/3 z-10" />

          {/* Right Dark Vignette Layer */}
          <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-black/90 via-black/60 to-transparent z-10" />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 w-full flex flex-col lg:flex-row items-start lg:items-center justify-between h-full gap-8">
          
          {/* Left Text Block */}
          <div className="max-w-3xl space-y-4 pt-2">
            <h1 className="text-5xl sm:text-7xl lg:text-[84px] font-bold tracking-tight text-white drop-shadow-xl leading-[1.02]">
              Forecast <span className="font-serif italic font-normal text-white">Future</span> Fares.
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-slate-100 font-medium leading-relaxed max-w-2xl drop-shadow-md">
              Continuous-learning ML airfare price prediction and horizon forecasting for domestic Indian flight corridors.
            </p>

            <div className="pt-3 flex items-center gap-3 text-xs sm:text-sm font-extrabold tracking-[0.25em] text-slate-300 uppercase drop-shadow-sm">
              <span className="h-[2px] w-10 bg-white" />
              <span>GRADIENT BOOSTING • MACHINE LEARNING ENGINE</span>
            </div>
          </div>

          {/* Right Text Block: Ultra Crisp Vertical Typography */}
          <div className="hidden lg:flex flex-col items-end justify-start self-stretch py-2 text-right gap-8">
            <div className="space-y-1.5 text-xs font-black tracking-[0.35em] text-white uppercase leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              <div>MODEL</div>
              <div>PREDICT</div>
              <div>HORIZON</div>
              <div>ACCURACY</div>
              <div className="pt-2 text-white/90">—</div>
            </div>
          </div>

        </div>
      </div>

      {/* FLOATING GLASS CARDS CONTAINER */}
      <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 -mt-14 sm:-mt-20 relative z-30 space-y-8 pb-16">
        <PredictionDashboardClient
          initialRegistryStats={registryStats}
          initialPredictions={recentPredictions}
          initialCorridors={corridorStats}
          initialRealFlights={realFlights}
        />
      </div>
    </div>
  );
}
