import Image from "next/image";
import Link from "next/link";
import { getElasticityData } from "@/lib/services/elasticity.service";
import { getTrackedRoutes } from "@/lib/services/routes.service";
import { ElasticityCurveChart } from "@/components/charts/ElasticityCurveChart";
import { prisma } from "@/lib/db/prisma";
import { Database, Clock, TrendingDown, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { DashboardClosingBanner } from "@/components/DashboardClosingBanner";

export const metadata = {
  title: "Lead-Time Fare Elasticity | AURA",
  description: "Analyze how ticket prices escalate as the advance purchase booking window narrows prior to departure.",
};

export const revalidate = 30; // Refresh every 30s

interface ElasticityPageProps {
  searchParams: Promise<{
    origin?: string;
    destination?: string;
  }>;
}

const CITY_NAMES: Record<string, string> = {
  DEL: "Delhi",
  BOM: "Mumbai",
  BLR: "Bengaluru",
  CCU: "Kolkata",
  HYD: "Hyderabad",
  MAA: "Chennai",
};

export default async function ElasticityPage({ searchParams }: ElasticityPageProps) {
  const params = await searchParams;
  const routes = await getTrackedRoutes();

  // Default to first route if none specified
  const selectedOrigin = params.origin || (routes.length > 0 ? routes[0].origin : "BLR");
  const selectedDestination = params.destination || (routes.length > 0 ? routes[0].destination : "HYD");

  const [elasticityData, benchmarkRecord] = await Promise.all([
    getElasticityData(selectedOrigin, selectedDestination),
    prisma.route_base_values.findFirst({
      where: { route_origin: selectedOrigin, route_destination: selectedDestination },
    }),
  ]);

  const baseBenchmark = benchmarkRecord ? Math.round(Number(benchmarkRecord.base_avg_fare)) : undefined;

  return (
    <div className="relative w-full overflow-hidden space-y-0 font-sans">
      {/* 
        ========================================================================
        1. HERO PANORAMA BANNER (Proper top breathing room below frosted header)
        - Wide-angle cinematic aviation horizon image (/dashboard/elasticity_hero.jpg)
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
            src="/dashboard/elasticity_hero.jpg"
            alt="Aircraft Horizon Elasticity Panorama"
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
              Advance <span className="font-serif italic font-normal text-white">Booking</span> Dynamics.
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-slate-100 font-medium leading-relaxed max-w-2xl drop-shadow-md">
              Analyze how ticket prices escalate as advance purchase booking window narrows prior to departure.
            </p>

            <div className="pt-3 flex items-center gap-3 text-xs sm:text-sm font-extrabold tracking-[0.25em] text-slate-300 uppercase drop-shadow-sm">
              <span className="h-[2px] w-10 bg-white" />
              <span>LEAD-TIME FARE ELASTICITY • ADVANCE WINDOW CURVE</span>
            </div>
          </div>

          {/* Right Text Block: Ultra Crisp Vertical Typography */}
          <div className="hidden lg:flex flex-col items-end justify-start self-stretch py-2 text-right gap-8">
            <div className="space-y-1.5 text-xs font-black tracking-[0.35em] text-white uppercase leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              <div>ELASTICITY</div>
              <div>CURVE</div>
              <div>LEADTIME</div>
              <div>SAVINGS</div>
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
        {/* Corridor Selector Card */}
        <div className="rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 block">
              Select Route Corridor:
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Database className="h-3 w-3" /> Live DB Aggregations
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {routes.map((r) => {
              const isSelected = selectedOrigin === r.origin && selectedDestination === r.destination;
              return (
                <Link
                  key={`${r.origin}-${r.destination}`}
                  href={`/dashboard/elasticity?origin=${r.origin}&destination=${r.destination}`}
                  className={`rounded-full px-4 py-2 text-xs font-mono font-bold transition border ${
                    isSelected
                      ? "bg-slate-950 text-white border-slate-950 shadow-md scale-[1.02]"
                      : "bg-slate-50/90 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <span>
                    {r.origin} &rarr; {r.destination}
                  </span>
                  <span className="ml-1.5 opacity-70 font-sans text-[10px] font-normal">
                    ({CITY_NAMES[r.origin] || r.origin} &rarr; {CITY_NAMES[r.destination] || r.destination})
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Elasticity Chart Card */}
        <div className="rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-blue-600 text-white px-2.5 py-1 rounded-md">
                  {selectedOrigin} &rarr; {selectedDestination}
                </span>
                <h2 className="text-xl font-black text-slate-950 tracking-tight">
                  {CITY_NAMES[selectedOrigin] || selectedOrigin} &rarr;{" "}
                  {CITY_NAMES[selectedDestination] || selectedDestination} Price Elasticity Curve
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Average, lowest, and peak fares (INR) evaluated across booking horizons prior to departure
              </p>
            </div>

            {baseBenchmark && (
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Historical Route Base
                </span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  ₹{baseBenchmark.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>

          <ElasticityCurveChart
            data={elasticityData}
            origin={selectedOrigin}
            destination={selectedDestination}
            baseBenchmark={baseBenchmark}
          />
        </div>

        {/* Closing Quote Banner */}
        <DashboardClosingBanner quote="TIME CHANGES THE FARE. WE MEASURE WHEN." />
      </div>
    </div>
  );
}
