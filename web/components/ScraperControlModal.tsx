"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Play, Terminal, X } from "lucide-react";

interface ScraperControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (params: { source: string; route: string; window: string }) => Promise<void>;
}

const PLATFORMS = [
  { id: "12", name: "All Operational Sources (Recommended)", type: "Combined", status: "Operational", rec: true },
  { id: "1", name: "EaseMyTrip", type: "OTA", status: "Operational" },
  { id: "2", name: "Ixigo", type: "OTA", status: "Operational" },
  { id: "3", name: "Cleartrip", type: "OTA", status: "Operational" },
  { id: "7", name: "IndiGo", type: "Airline", status: "Operational" },
  { id: "9", name: "Air India Express", type: "Airline", status: "Operational" },
  { id: "10", name: "Akasa Air", type: "Airline", status: "Operational" },
  { id: "11", name: "SpiceJet", type: "Airline", status: "Operational" },
  { id: "4", name: "MakeMyTrip", type: "OTA", status: "Bot Protected", protected: true },
  { id: "5", name: "Goibibo", type: "OTA", status: "Bot Protected", protected: true },
];

const CORRIDORS = [
  { id: "ALL", name: "All 6 DGCA Corridors (100% Weight)", code: "ALL", rec: true },
  { id: "DEL-BOM", name: "Delhi – Mumbai (28% Traffic Weight)", code: "DEL-BOM" },
  { id: "DEL-BLR", name: "Delhi – Bengaluru (22% Traffic Weight)", code: "DEL-BLR" },
  { id: "BOM-BLR", name: "Mumbai – Bengaluru (18% Traffic Weight)", code: "BOM-BLR" },
  { id: "DEL-CCU", name: "Delhi – Kolkata (14% Traffic Weight)", code: "DEL-CCU" },
  { id: "BLR-HYD", name: "Bengaluru – Hyderabad (10% Traffic Weight)", code: "BLR-HYD" },
  { id: "MAA-DEL", name: "Chennai – Delhi (8% Traffic Weight)", code: "MAA-DEL" },
];

const WINDOWS = [
  { id: "3", name: "T+7 Days (1 Week Out - DEFAULT)", desc: "Moderate Window", rec: true },
  { id: "1", name: "T+0 Days (Same Day / Today)", desc: "Emergency Surge" },
  { id: "2", name: "T+1 Day (Tomorrow)", desc: "Last-Minute Spike" },
  { id: "4", name: "T+15 Days (2 Weeks Out)", desc: "Standard Window" },
  { id: "5", name: "T+30 Days (1 Month Out)", desc: "Normal Advance" },
  { id: "6", name: "T+45 Days (1.5 Months Out)", desc: "Early-Bird Cheapest" },
  { id: "7", name: "ALL Booking Windows", desc: "Complete Elasticity Curve" },
];

export default function ScraperControlModal({ isOpen, onClose, onLaunch }: ScraperControlModalProps) {
  const [selectedSource, setSelectedSource] = useState("12");
  const [selectedRoute, setSelectedRoute] = useState("ALL");
  const [selectedWindow, setSelectedWindow] = useState("3");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onLaunch({
        source: selectedSource,
        route: selectedRoute,
        window: selectedWindow,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-sans shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>Interactive Scraper Probe Control</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-0.5">
              Configure Live Scrape Engine Probe
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Select target platform, corridor route, and advance booking window (matching Terminal CLI Options).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* STEP 1: Select Platform */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>STEP 1: Select Target Platform / OTA</span>
              <span className="text-[10px] text-emerald-400 font-mono">Option {selectedSource}</span>
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}. {p.name} [{p.type}] — {p.status}
                </option>
              ))}
            </select>
          </div>

          {/* STEP 2: Select Corridor */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>STEP 2: Select DGCA Corridor / City-Pair Route</span>
              <span className="text-[10px] text-emerald-400 font-mono">{selectedRoute}</span>
            </label>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {CORRIDORS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* STEP 3: Select Advance Window */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>STEP 3: Select Advance Purchase Booking Window</span>
              <span className="text-[10px] text-emerald-400 font-mono">Option {selectedWindow}</span>
            </label>
            <select
              value={selectedWindow}
              onChange={(e) => setSelectedWindow(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {WINDOWS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.id}. {w.name} — {w.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Target Preview Box */}
          <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-lg text-xs space-y-1 font-mono">
            <div className="text-[10px] uppercase font-bold text-emerald-400">🚀 Target Probe Configuration Summary</div>
            <div className="flex justify-between text-slate-300">
              <span>Target Source:</span>
              <span className="text-cyan-400 font-bold">{PLATFORMS.find(p => p.id === selectedSource)?.name}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Target Corridor:</span>
              <span className="text-yellow-400 font-bold">{selectedRoute}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Booking Window:</span>
              <span className="text-pink-400 font-bold">{WINDOWS.find(w => w.id === selectedWindow)?.name}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 p-4 bg-slate-900/50 gap-2">
          <Button variant="outline" onClick={onClose} size="sm" className="text-xs border-slate-800">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs font-semibold"
          >
            {isSubmitting ? (
              <>
                <Zap className="w-3.5 h-3.5 animate-spin" />
                <span>Launching Playwright Probe...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>🚀 Launch Live Scrape Engine</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
