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
    <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-xs">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#08080D]" />
          <h2 className="font-heading text-[#08080D] font-bold text-base">Select Route & Airline</h2>
        </div>
        {/* Segmented control toggle style matching brandline specification */}
        <div className="flex items-center rounded-full bg-[#E5E7EB] p-1 text-xs">
          <button type="button" className="rounded-full bg-[#08080D] px-3 py-1 font-semibold text-white">
            Flights
          </button>
          <button type="button" className="rounded-full px-3 py-1 font-medium text-[#08080D]/60 hover:text-[#08080D]">
            Hotels
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Origin */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#08080D]/60 uppercase tracking-wider">
            Origin City
          </label>
          <select
            value={origin}
            onChange={(e) => onOriginChange(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#F3F6F7] border border-black/5 text-[#08080D] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#08080D] cursor-pointer"
          >
            <option value="">Select departure airport</option>
            {airports.map((code) => (
              <option key={code} value={code} className="bg-white text-[#08080D]">
                {CITY_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#08080D]/60 uppercase tracking-wider">
            Destination City
          </label>
          <select
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#F3F6F7] border border-black/5 text-[#08080D] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#08080D] cursor-pointer"
          >
            <option value="">Select arrival airport</option>
            {airports
              .filter((c) => c !== origin)
              .map((code) => (
                <option key={code} value={code} className="bg-white text-[#08080D]">
                  {CITY_LABELS[code]}
                </option>
              ))}
          </select>
        </div>

        {/* Airline */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#08080D]/60 uppercase tracking-wider">
            Carrier / Airline
          </label>
          <select
            value={airline}
            onChange={(e) => onAirlineChange(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#F3F6F7] border border-black/5 text-[#08080D] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#08080D] cursor-pointer"
          >
            <option value="">Select airline carrier</option>
            {airlines.map((a) => (
              <option key={a} value={a} className="bg-white text-[#08080D]">
                {a}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="darkPill"
          onClick={onAnalyze}
          disabled={loading || !origin || !destination || !airline}
          className="w-full mt-3 gap-2 py-3.5"
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
