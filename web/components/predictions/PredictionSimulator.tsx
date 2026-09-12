"use client";

import React, { useState, useEffect } from "react";
import {
  Plane,
  Calendar,
  IndianRupee,
  Sliders,
  Sparkles,
  ChevronDown,
  Layers,
  ArrowRight,
} from "lucide-react";
import { FlightPredictionInput, FlightPredictionResult } from "@/lib/ml/types";

interface RouteOption {
  origin: string;
  destination: string;
  label: string;
  benchmark: number;
}

const POPULAR_ROUTES: RouteOption[] = [
  { origin: "DEL", destination: "BOM", label: "Delhi → Mumbai", benchmark: 5500 },
  { origin: "CCU", destination: "DEL", label: "Kolkata → Delhi", benchmark: 5100 },
  { origin: "BLR", destination: "DEL", label: "Bengaluru → Delhi", benchmark: 6200 },
  { origin: "BOM", destination: "BLR", label: "Mumbai → Bengaluru", benchmark: 4200 },
  { origin: "HYD", destination: "DEL", label: "Hyderabad → Delhi", benchmark: 4800 },
  { origin: "MAA", destination: "DEL", label: "Chennai → Delhi", benchmark: 5600 },
];

const AIRLINES = [
  "IndiGo",
  "Air India",
  "Vistara",
  "SpiceJet",
  "Akasa Air",
  "AirAsia India",
];

interface PredictionSimulatorProps {
  onPredictionChange: (result: FlightPredictionResult | null) => void;
  onLoadingChange: (loading: boolean) => void;
}

export function PredictionSimulator({
  onPredictionChange,
  onLoadingChange,
}: PredictionSimulatorProps) {
  const [selectedRoute, setSelectedRoute] = useState<RouteOption>(POPULAR_ROUTES[0]);
  const [airline, setAirline] = useState<string>("IndiGo");
  const [daysToDeparture, setDaysToDeparture] = useState<number>(7);
  const [currentPrice, setCurrentPrice] = useState<number>(5500);
  const [stops, setStops] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(130);
  const [showFeatures, setShowFeatures] = useState<boolean>(false);
  const [activeFeatures, setActiveFeatures] = useState<Record<string, any> | null>(null);

  const runPrediction = async (
    route = selectedRoute,
    air = airline,
    days = daysToDeparture,
    price = currentPrice,
    st = stops,
    dur = durationMinutes
  ) => {
    onLoadingChange(true);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: route.origin,
          destination: route.destination,
          airline: air,
          daysToDeparture: days,
          currentPrice: price,
          stops: st,
          durationMinutes: dur,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate prediction");
      }

      const json = await res.json();
      if (json.success && json.data) {
        onPredictionChange(json.data);
        setActiveFeatures(json.data.features);
      }
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      onLoadingChange(false);
    }
  };

  // Run initial prediction on mount
  useEffect(() => {
    runPrediction(POPULAR_ROUTES[0], "IndiGo", 7, 5500, 0, 130);
  }, []);

  const handleRouteChange = (r: RouteOption) => {
    setSelectedRoute(r);
    setCurrentPrice(r.benchmark);
    runPrediction(r, airline, daysToDeparture, r.benchmark, stops, durationMinutes);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/60 text-purple-400 border border-purple-500/25">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Interactive ML Flight Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Simulate flight characteristics to forecast future pricing trajectories
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowFeatures(!showFeatures)}
          className="text-xs font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 border border-purple-500/25 px-2.5 py-1 rounded bg-purple-950/30 transition"
        >
          <Layers className="h-3.5 w-3.5" />
          <span>{showFeatures ? "Hide Features" : "View 14 ML Features"}</span>
        </button>
      </div>

      {/* Corridor Quick Select */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Domestic Route Corridor:
        </label>
        <div className="flex flex-wrap gap-2">
          {POPULAR_ROUTES.map((r) => {
            const isSelected =
              selectedRoute.origin === r.origin &&
              selectedRoute.destination === r.destination;
            return (
              <button
                key={`${r.origin}-${r.destination}`}
                onClick={() => handleRouteChange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono transition border ${
                  isSelected
                    ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20 font-bold"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {r.origin} → {r.destination}
              </button>
            );
          })}
        </div>
      </div>

      {/* Airline and Flight Detail Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Carrier */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Plane className="h-3.5 w-3.5 text-purple-400" />
            Operating Carrier
          </label>
          <select
            value={airline}
            onChange={(e) => {
              const val = e.target.value;
              setAirline(val);
              runPrediction(selectedRoute, val, daysToDeparture, currentPrice, stops, durationMinutes);
            }}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {AIRLINES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Days to Departure */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-medium text-slate-300 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              Lead Days (T-Minus)
            </label>
            <span className="font-mono font-bold text-purple-400">
              {daysToDeparture} {daysToDeparture === 1 ? "day" : "days"}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="60"
            value={daysToDeparture}
            onChange={(e) => {
              const val = Number(e.target.value);
              setDaysToDeparture(val);
              runPrediction(selectedRoute, airline, val, currentPrice, stops, durationMinutes);
            }}
            className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Current Fare */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-emerald-400" />
            Current Live Fare (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-sm text-slate-500">₹</span>
            <input
              type="number"
              step="100"
              min="1000"
              max="50000"
              value={currentPrice}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCurrentPrice(val);
                runPrediction(selectedRoute, airline, daysToDeparture, val, stops, durationMinutes);
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-7 pr-3 py-2 text-sm text-slate-200 font-mono focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Stops */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Stops</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: "Non-stop", val: 0 },
              { label: "1 Stop", val: 1 },
              { label: "2+ Stops", val: 2 },
            ].map((s) => (
              <button
                key={s.val}
                type="button"
                onClick={() => {
                  setStops(s.val);
                  runPrediction(selectedRoute, airline, daysToDeparture, currentPrice, s.val, durationMinutes);
                }}
                className={`py-2 text-xs font-medium rounded-lg border transition ${
                  stops === s.val
                    ? "bg-purple-600/20 text-purple-300 border-purple-500/50 font-semibold"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Inspector Tray */}
      {showFeatures && activeFeatures && (
        <div className="rounded-lg bg-slate-900/90 border border-purple-500/30 p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              14-Dimensional Engineered Feature Vector (Passed to Gradient Boosting Regressor)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              aura_ml.features.engineer
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {Object.entries(activeFeatures).map(([k, v]) => (
              <div key={k} className="rounded bg-slate-950 border border-slate-800 p-2">
                <div className="text-[10px] text-slate-400 truncate" title={k}>
                  {k}
                </div>
                <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                  {typeof v === "number" ? v.toLocaleString() : String(v)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
