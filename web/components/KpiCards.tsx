"use client";

import { FareAnalyzeResult } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardsProps {
  data: FareAnalyzeResult;
}

function formatINR(v: number) {
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

function ChangeTag({ value, label }: { value: number; label: string }) {
  const isUp = value > 0;
  const isDown = value < 0;
  
  return (
    <div className="flex items-center justify-between border-b border-black/5 py-1.5 last:border-0 font-body">
      <span className="text-[10px] text-[#08080D]/60 uppercase tracking-widest font-mono font-medium">{label}</span>
      <div className={`flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
        isUp ? "bg-red-50 text-red-700 border border-red-200" : isDown ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-[#F3F6F7] text-[#08080D]"
      }`}>
        {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        {isUp ? "+" : ""}{(value || 0).toFixed(1)}%
      </div>
    </div>
  );
}

export default function KpiCards({ data }: KpiCardsProps) {
  const { analytics, currentFare, route, airline } = data;

  return (
    <div className="space-y-6 font-body">
      {/* Hero Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CURRENT FARE CARD */}
        <div className="relative group rounded-3xl border border-black/5 bg-white p-7 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-[#08080D]/60 font-mono uppercase tracking-[0.2em] flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 bg-[#08080D] rounded-full animate-pulse" />
                Live Spot Rate
              </p>
              <h3 className="font-heading text-base font-bold text-[#08080D] mt-1">{route} • {airline}</h3>
            </div>
          </div>
          
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl md:text-5xl font-black font-mono tracking-tighter text-[#08080D]">
                {formatINR(currentFare)}
              </span>
              <span className="text-xs text-[#08080D]/60 font-mono font-medium">INR</span>
            </div>
            
            <div className="w-full sm:w-48 flex flex-col">
              <ChangeTag value={analytics.changeVs7Days} label="vs 7D Avg" />
              <ChangeTag value={analytics.changeVs30Days} label="vs 30D Avg" />
            </div>
          </div>
        </div>

        {/* APIX INDEX CARD */}
        <div className="relative group rounded-3xl border border-black/5 bg-[#F3F6F7] p-7 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-[#08080D] font-mono uppercase tracking-[0.2em] flex items-center gap-2 font-bold">
                <span className="w-2 h-2 bg-[#08080D] rounded-full" />
                APIx Master Index
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs border border-black/10 px-2.5 py-0.5 text-[#08080D] font-mono bg-white rounded-full font-semibold">
                  Base: 100
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl md:text-5xl font-black font-mono tracking-tighter text-[#08080D]">
                {(analytics.currentApixIndex || 100).toFixed(1)}
              </span>
            </div>
            
            <div className="flex flex-col gap-2 text-right">
              <div>
                <p className="text-[10px] text-[#08080D]/60 uppercase font-mono tracking-widest font-semibold">7D Trailing Index</p>
                <p className="text-lg font-bold font-mono text-[#08080D]">{(analytics.sevenDayApixIndex || 100).toFixed(1)}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#08080D]/60 uppercase font-mono tracking-widest font-semibold">30D Base Index</p>
                <p className="text-lg font-bold font-mono text-[#08080D]">{(analytics.thirtyDayApixIndex || 100).toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Mini Data Points */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniCard label="7-Day Moving Avg" value={formatINR(analytics.sevenDayAverage)} />
        <MiniCard label="30-Day Moving Avg" value={formatINR(analytics.thirtyDayAverage)} />
        <MiniCard label="Absolute Minimum" value={formatINR(analytics.minimumFare)} colorClass="text-emerald-700" />
        <MiniCard label="Absolute Maximum" value={formatINR(analytics.maximumFare)} colorClass="text-red-700" />
      </div>
    </div>
  );
}

function MiniCard({ label, value, colorClass = "text-[#08080D]" }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-5 shadow-xs hover:shadow-md transition-all">
      <p className="text-[10px] text-[#08080D]/60 font-mono uppercase tracking-[0.1em] mb-1.5 font-semibold">{label}</p>
      <p className={`text-lg md:text-xl font-bold font-mono ${colorClass}`}>{value}</p>
    </div>
  );
}
