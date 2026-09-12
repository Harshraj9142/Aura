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
    <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5 last:border-0">
      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">{label}</span>
      <div className={`flex items-center gap-1.5 text-xs font-mono font-medium px-2 py-0.5 rounded-sm ${
        isUp ? "bg-red-500/10 text-red-400" : isDown ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
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
    <div className="space-y-6">
      {/* Hero Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CURRENT FARE CARD */}
        <div className="relative group rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
          
          <div className="relative p-6 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Live Spot Rate
                </p>
                <h3 className="text-sm font-medium text-slate-200 mt-1">{route} • {airline}</h3>
              </div>
            </div>
            
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl md:text-6xl font-black font-mono tracking-tighter text-white">
                  {formatINR(currentFare)}
                </span>
                <span className="text-sm text-slate-400 font-mono mb-2">INR</span>
              </div>
              
              <div className="w-full sm:w-44 flex flex-col">
                <ChangeTag value={analytics.changeVs7Days} label="vs 7D Avg" />
                <ChangeTag value={analytics.changeVs30Days} label="vs 30D Avg" />
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
        </div>

        {/* APIX INDEX CARD */}
        <div className="relative group rounded-xl border border-emerald-500/30 bg-emerald-950/20 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />
          
          <div className="relative p-6 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_currentColor]" />
                  APIx Master Index
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs border border-emerald-500/30 px-2 py-0.5 text-emerald-400 font-mono bg-emerald-500/10 rounded">
                    Base: 100
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl md:text-6xl font-black font-mono tracking-tighter text-white">
                  {(analytics.currentApixIndex || 100).toFixed(1)}
                </span>
              </div>
              
              <div className="flex flex-col gap-2 text-right">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">7D Trailing Index</p>
                  <p className="text-lg font-bold font-mono text-slate-200">{(analytics.sevenDayApixIndex || 100).toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">30D Base Index</p>
                  <p className="text-lg font-bold font-mono text-slate-200">{(analytics.thirtyDayApixIndex || 100).toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
        </div>
      </div>

      {/* 4 Mini Data Points */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800 border border-slate-800 rounded-xl overflow-hidden">
        <MiniCard label="7-Day Moving Avg" value={formatINR(analytics.sevenDayAverage)} />
        <MiniCard label="30-Day Moving Avg" value={formatINR(analytics.thirtyDayAverage)} />
        <MiniCard label="Absolute Minimum" value={formatINR(analytics.minimumFare)} colorClass="text-emerald-400" />
        <MiniCard label="Absolute Maximum" value={formatINR(analytics.maximumFare)} colorClass="text-red-400" />
      </div>
    </div>
  );
}

function MiniCard({ label, value, colorClass = "text-white" }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="bg-slate-950 p-5 hover:bg-slate-900/80 transition-colors">
      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-[0.1em] mb-2">{label}</p>
      <p className={`text-xl md:text-2xl font-bold font-mono ${colorClass}`}>{value}</p>
    </div>
  );
}
