"use client";

import { FareTrend } from "@/lib/api";
import { TrendingUp, TrendingDown, Activity, TerminalSquare, AlertCircle } from "lucide-react";

interface AnalyticsPanelProps {
  trend: FareTrend;
}

export default function AnalyticsPanel({ trend }: AnalyticsPanelProps) {
  const isIncreasing = trend.direction === 'INCREASING';
  const isDecreasing = trend.direction === 'DECREASING';
  
  const volatilityColor = 
    trend.volatility === 'HIGH' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 
    trend.volatility === 'MODERATE' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 
    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

  const dotColor = 
    trend.volatility === 'HIGH' ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]' : 
    trend.volatility === 'MODERATE' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 
    'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-800 bg-slate-900/60">
        <TerminalSquare className="w-4 h-4 text-emerald-400" />
        <h3 className="text-slate-200 font-mono text-xs uppercase tracking-widest font-semibold">
          Statistical Intelligence Subsystem
        </h3>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">MoSPI Engine Online</span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Trend Direction Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
            <p className="text-[10px] font-medium text-slate-400 font-mono uppercase tracking-[0.15em] mb-4">
              Market Trend Vector
            </p>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg border ${
                isIncreasing ? 'border-red-500/30 bg-red-500/10' : 
                isDecreasing ? 'border-emerald-500/30 bg-emerald-500/10' : 
                'border-blue-500/30 bg-blue-500/10'
              }`}>
                {isIncreasing && <TrendingUp className="w-6 h-6 text-red-400" />}
                {isDecreasing && <TrendingDown className="w-6 h-6 text-emerald-400" />}
                {!isIncreasing && !isDecreasing && <Activity className="w-6 h-6 text-blue-400" />}
              </div>
              <span className="text-xl font-bold font-mono text-white tracking-wider">
                {trend.direction}
              </span>
            </div>
          </div>

          {/* Volatility Index Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
            <p className="text-[10px] font-medium text-slate-400 font-mono uppercase tracking-[0.15em] mb-4">
              Price Volatility Index
            </p>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-lg border flex items-center gap-3 ${volatilityColor}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                <span className="text-lg font-bold font-mono tracking-wider">
                  {trend.volatility}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Observation Log */}
        <div className="border border-emerald-500/20 bg-emerald-950/20 rounded-lg p-4 flex gap-3.5 items-start relative overflow-hidden">
          <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest font-semibold">System Observation</p>
            <p className="text-sm text-slate-300 font-mono leading-relaxed">
              {trend.note}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
