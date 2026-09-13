import { Metadata } from "next";
import Image from "next/image";
import { getHeatmapData } from "@/lib/services/heatmap.service";
import { HeatmapGrid } from "@/components/charts/HeatmapGrid";
import { ExportButtons } from "@/components/dashboard/ExportButtons";
import { Database } from "lucide-react";

export const metadata: Metadata = {
  title: "Route × Travel Date Fare Heatmap | AURA",
  description:
    "Multi-dimensional route x travel date airfare intensity matrix comparing live airline and OTA pricing against historical benchmarks.",
};

export const revalidate = 60; // Revalidate every minute

interface HeatmapPageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function HeatmapPage({ searchParams }: HeatmapPageProps) {
  const params = await searchParams;
  const heatmapData = await getHeatmapData(params.dateFrom, params.dateTo);

  return (
    <div className="relative w-full overflow-hidden space-y-0 font-sans">
      {/* 
        ========================================================================
        1. HERO PANORAMA BANNER (Identical layout & typography across all tabs)
        - Wide-angle cinematic aerial tarmac sunset image (/dashboard/heatmap_hero.jpg)
        ========================================================================
      */}
      <div className="relative w-full min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] flex flex-col justify-between pt-24 sm:pt-28 pb-20 sm:pb-24 px-6 sm:px-10 lg:px-14 xl:px-16">
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
            src="/dashboard/heatmap_hero.jpg"
            alt="Airport Runway Heatmap Horizon Panorama"
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
              Thermal <span className="font-serif italic font-normal text-white">Route</span> Intensity.
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-slate-100 font-medium leading-relaxed max-w-2xl drop-shadow-md">
              Multi-dimensional route x travel date airfare intensity matrix across all Indian flight corridors.
            </p>

            <div className="pt-3 flex items-center gap-3 text-xs sm:text-sm font-extrabold tracking-[0.25em] text-slate-300 uppercase drop-shadow-sm">
              <span className="h-[2px] w-10 bg-white" />
              <span>ROUTE DENSITY • DEPARTURE DATE FARE HEATMAP</span>
            </div>
          </div>

          {/* Right Text Block: Ultra Crisp Vertical Typography */}
          <div className="hidden lg:flex flex-col items-end justify-start self-stretch py-2 text-right gap-8">
            <div className="space-y-1.5 text-xs font-black tracking-[0.35em] text-white uppercase leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              <div>HEATMAP</div>
              <div>MATRIX</div>
              <div>DENSITY</div>
              <div>FARES</div>
              <div className="pt-2 text-white/90">—</div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        2. FLOATING GLASS CARDS CONTAINER (100% Full Viewport Width)
        ========================================================================
      */}
      <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 -mt-14 sm:-mt-20 relative z-30 space-y-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                Route × Travel Date Fare Matrix
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                <Database className="h-3 w-3" />
                Live DB Fares
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Cross-corridor matrix analyzing day-by-day airfares against historical baseline benchmarks to pinpoint peak surges and booking windows.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ExportButtons data={heatmapData} filename="apix_fare_heatmap" />
          </div>
        </div>

        <HeatmapGrid data={heatmapData} />
      </div>
    </div>
  );
}
