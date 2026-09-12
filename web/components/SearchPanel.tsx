"use client";

import { RouteInfo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, Loader2 } from "lucide-react";

const CITY_LABELS: Record<string, string> = {
  DEL: 'Delhi (DEL)',
  BOM: 'Mumbai (BOM)',
  BLR: 'Bengaluru (BLR)',
  CCU: 'Kolkata (CCU)',
  HYD: 'Hyderabad (HYD)',
  MAA: 'Chennai (MAA)',
};

interface SearchPanelProps {
  routes?: RouteInfo[];
  airlines: string[];
  origin: string;
  destination: string;
  airline: string;
  onOriginChange: (v: string) => void;
  onDestinationChange: (v: string) => void;
  onAirlineChange: (v: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}

export default function SearchPanel({
  airlines,
  origin,
  destination,
  airline,
  onOriginChange,
  onDestinationChange,
  onAirlineChange,
  onAnalyze,
  loading,
}: SearchPanelProps) {
  const airports = Object.keys(CITY_LABELS);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-800">
        <Search className="w-4 h-4 text-emerald-400" />
        <h2 className="text-slate-100 font-semibold text-sm">Select Route & Airline</h2>
      </div>

      <div className="space-y-4">
        {/* Origin */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Origin City
          </label>
          <select
            value={origin}
            onChange={(e) => onOriginChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
          >
            <option value="">Select departure airport</option>
            {airports.map((code) => (
              <option key={code} value={code} className="bg-slate-900 text-slate-100">
                {CITY_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Destination City
          </label>
          <select
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
          >
            <option value="">Select arrival airport</option>
            {airports
              .filter((c) => c !== origin)
              .map((code) => (
                <option key={code} value={code} className="bg-slate-900 text-slate-100">
                  {CITY_LABELS[code]}
                </option>
              ))}
          </select>
        </div>

        {/* Airline */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Carrier / Airline
          </label>
          <select
            value={airline}
            onChange={(e) => onAirlineChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
          >
            <option value="">Select airline carrier</option>
            {airlines.map((a) => (
              <option key={a} value={a} className="bg-slate-900 text-slate-100">
                {a}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={onAnalyze}
          disabled={loading || !origin || !destination || !airline}
          className="w-full mt-2 gap-2"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Index...</span>
            </>
          ) : (
            <>
              <span>Analyze Fare Index</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
