"use client";

import { useState } from "react";

interface CpiSimulatorProps {
  currentApiScore: number;
}

export function CpiSimulator({ currentApiScore }: CpiSimulatorProps) {
  const [fareSurgePct, setFareSurgePct] = useState<number>(5);

  // In India CPI, Air Transport weight is ~0.42% of overall CPI basket
  const airfareCpiWeight = 0.0042;
  const simulatedScore = currentApiScore * (1 + fareSurgePct / 100);
  const cpiImpactPercentagePoints = (fareSurgePct * airfareCpiWeight).toFixed(3);
  const transportSubgroupImpact = (fareSurgePct * 0.05).toFixed(2);

  return (
    <div className="rounded-xl border border-blue-900/40 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-800/50 mb-2">
            <span>✨ NSO / RBI Analytical Tool</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Interactive CPI Inflation Impact Simulator
          </h2>
          <p className="text-xs text-slate-400">
            Simulate how airfare price surges impact India&apos;s overall Consumer Price Index (CPI) retail inflation.
          </p>
        </div>

        <div className="text-right bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Baseline APIx Index
          </span>
          <span className="text-xl font-mono font-extrabold text-blue-400">
            {currentApiScore.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Slider Control */}
      <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 mb-6">
        <div className="flex justify-between items-center text-xs font-medium">
          <label htmlFor="fare-surge-slider" className="text-slate-300">Simulated Airfare Surge Rate (%):</label>
          <span className="font-mono font-bold text-blue-400 text-sm">
            +{fareSurgePct}%
          </span>
        </div>
        <input
          id="fare-surge-slider"
          type="range"
          min="-20"
          max="50"
          step="1"
          value={fareSurgePct}
          onChange={(e) => setFareSurgePct(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>-20% (Festival Drop)</span>
          <span>0% (Baseline)</span>
          <span>+25% (Peak Festival)</span>
          <span>+50% (Fuel Crisis)</span>
        </div>
      </div>

      {/* Impact Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-slate-900/90 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Simulated APIx Index
          </span>
          <span className="text-lg font-mono font-bold text-white">
            {simulatedScore.toFixed(2)}
          </span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">
            {fareSurgePct >= 0 ? `+${fareSurgePct}%` : `${fareSurgePct}%`} vs Baseline
          </span>
        </div>

        <div className="rounded-lg bg-slate-900/90 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Transport Subgroup Impact
          </span>
          <span className="text-lg font-mono font-bold text-amber-400">
            +{transportSubgroupImpact}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Subgroup Weight: 8.59%
          </span>
        </div>

        <div className="rounded-lg bg-slate-900/90 p-3 border border-blue-500/30 bg-blue-950/20">
          <span className="text-[10px] uppercase font-bold text-blue-400 block">
            National CPI Inflation Impact
          </span>
          <span className="text-lg font-mono font-bold text-blue-300">
            +{cpiImpactPercentagePoints} pts
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Air Basket Weight: 0.42%
          </span>
        </div>
      </div>
    </div>
  );
}
