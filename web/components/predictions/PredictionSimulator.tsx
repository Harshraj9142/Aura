"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Sliders,
  Sparkles,
  Layers,
  Plane,
  Database,
} from "lucide-react";
import {
  CorridorLiveSummary,
  FlightPredictionResult,
  RealTrackedFlight,
} from "@/lib/ml/types";
import AirlineLogo from "@/components/AirlineLogo";

interface RouteOption {
  origin: string;
  destination: string;
  label: string;
  benchmark: number;
  durationMinutes: number;
  baseFare?: number;
  minFare?: number;
  maxFare?: number;
  count?: number;
}

const POPULAR_ROUTES: RouteOption[] = [
  { origin: "DEL", destination: "BOM", label: "Delhi → Mumbai", benchmark: 7078, durationMinutes: 130, baseFare: 7928, minFare: 1000, maxFare: 32995, count: 2073 },
  { origin: "DEL", destination: "BLR", label: "Delhi → Bengaluru", benchmark: 10130, durationMinutes: 165, baseFare: 8943, minFare: 1000, maxFare: 18194, count: 1829 },
  { origin: "BOM", destination: "BLR", label: "Mumbai → Bengaluru", benchmark: 7828, durationMinutes: 105, baseFare: 6635, minFare: 1000, maxFare: 22027, count: 1571 },
  { origin: "DEL", destination: "CCU", label: "Delhi → Kolkata", benchmark: 10105, durationMinutes: 135, baseFare: 7203, minFare: 3908, maxFare: 20939, count: 1406 },
  { origin: "BLR", destination: "HYD", label: "Bengaluru → Hyderabad", benchmark: 8568, durationMinutes: 75, baseFare: 4724, minFare: 2545, maxFare: 25743, count: 1076 },
  { origin: "MAA", destination: "DEL", label: "Chennai → Delhi", benchmark: 10800, durationMinutes: 170, baseFare: 8545, minFare: 4912, maxFare: 18293, count: 1000 },
];

const AIRLINES = [
  "IndiGo",
  "Air India",
  "Air India Express",
  "Akasa Air",
  "SpiceJet",
  "Vistara",
];

interface PredictionSimulatorProps {
  onPredictionChange: (result: FlightPredictionResult | null) => void;
  onLoadingChange: (loading: boolean) => void;
  initialCorridors?: CorridorLiveSummary[];
  initialRealFlights?: RealTrackedFlight[];
}

export function PredictionSimulator({
  onPredictionChange,
  onLoadingChange,
  initialCorridors,
  initialRealFlights,
}: PredictionSimulatorProps) {
  const corridorList: RouteOption[] =
    initialCorridors && initialCorridors.length > 0
      ? initialCorridors.map((c) => ({
          origin: c.origin,
          destination: c.destination,
          label: c.label,
          benchmark: c.liveAvgFare || c.baseFare,
          durationMinutes: c.durationMinutes,
          baseFare: c.baseFare,
          minFare: c.minFare,
          maxFare: c.maxFare,
          count: c.count,
        }))
      : POPULAR_ROUTES;

  const [selectedRoute, setSelectedRoute] = useState<RouteOption>(corridorList[0]);
  const [airline, setAirline] = useState<string>("IndiGo");
  const [daysToDeparture, setDaysToDeparture] = useState<number>(7);
  const [currentPrice, setCurrentPrice] = useState<number>(corridorList[0].benchmark);
  const [stops, setStops] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(corridorList[0].durationMinutes);
  const [showFeatures, setShowFeatures] = useState<boolean>(false);
  const [activeFeatures, setActiveFeatures] = useState<Record<string, unknown> | null>(null);

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
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        runPrediction(
          corridorList[0],
          "IndiGo",
          7,
          corridorList[0].benchmark,
          0,
          corridorList[0].durationMinutes
        );
      }
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRouteChange = (r: RouteOption) => {
    setSelectedRoute(r);
    setCurrentPrice(r.benchmark);
    setDurationMinutes(r.durationMinutes);
    runPrediction(r, airline, daysToDeparture, r.benchmark, stops, r.durationMinutes);
  };

  return (
    <div className="rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 p-6 sm:p-8 shadow-xl space-y-6">
      {/* Simulator Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                Interactive ML Flight Simulator
              </h3>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                Live DB Connected
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Simulate flight characteristics to forecast future pricing trajectories using 8,955 real observations
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowFeatures(!showFeatures)}
          className="text-xs font-mono font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1.5 border border-purple-200 px-3 py-1.5 rounded-xl bg-purple-50/70 hover:bg-purple-100 transition shadow-xs"
        >
          <Layers className="h-3.5 w-3.5" />
          <span>{showFeatures ? "Hide Features" : "View 14 ML Features"}</span>
        </button>
      </div>

      {/* Real Live Flights in Database Picker */}
      {initialRealFlights && initialRealFlights.length > 0 && (
        <div className="space-y-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Plane className="h-3.5 w-3.5 text-purple-600" />
              Real Scraped Flights from Database (Neon PostgreSQL):
            </span>
            <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100/60 border border-purple-200 px-2 py-0.5 rounded-full">
              Click to Simulate
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {initialRealFlights.slice(0, 6).map((f) => {
              const routeObj = corridorList.find(
                (c) => c.origin === f.origin && c.destination === f.destination
              ) || corridorList[0];
              const isSelected =
                airline === f.airline &&
                selectedRoute.origin === f.origin &&
                selectedRoute.destination === f.destination &&
                currentPrice === f.price;

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSelectedRoute(routeObj);
                    setAirline(f.airline);
                    setCurrentPrice(f.price);
                    setDurationMinutes(f.durationMinutes || routeObj.durationMinutes);
                    setStops(f.stops || 0);
                    runPrediction(
                      routeObj,
                      f.airline,
                      daysToDeparture,
                      f.price,
                      f.stops || 0,
                      f.durationMinutes || routeObj.durationMinutes
                    );
                  }}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs transition border ${
                    isSelected
                      ? "bg-slate-950 text-white border-slate-950 shadow-md font-bold scale-[1.02]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 shadow-xs font-medium"
                  }`}
                >
                  <AirlineLogo airline={f.airline} size="xs" />
                  <span className="font-bold">{f.flightNumber}</span>
                  <span className={`font-mono text-[11px] ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                    {f.origin}→{f.destination}
                  </span>
                  <span className={`font-mono font-black ${isSelected ? "text-emerald-300" : "text-emerald-600"}`}>
                    ₹{f.price.toLocaleString("en-IN")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Corridor Quick Select */}
      <div className="space-y-2.5">
        <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Domestic Route Corridor (Live Database Benchmarks):</span>
          <span className="text-[11px] font-mono text-purple-700 lowercase font-bold">
            6 tracked corridors
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {corridorList.map((r) => {
            const isSelected =
              selectedRoute.origin === r.origin &&
              selectedRoute.destination === r.destination;
            return (
              <button
                key={`${r.origin}-${r.destination}`}
                type="button"
                onClick={() => handleRouteChange(r)}
                className={`rounded-full px-4 py-2 text-xs font-mono transition border flex items-center gap-2 ${
                  isSelected
                    ? "bg-slate-950 text-white border-slate-950 shadow-md scale-[1.02] font-bold"
                    : "bg-white text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300 shadow-xs font-semibold"
                }`}
              >
                <span>{r.origin} → {r.destination}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isSelected ? "bg-slate-800 text-purple-300 font-bold" : "bg-slate-100 text-slate-700"}`}>
                  ₹{r.benchmark.toLocaleString("en-IN")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Corridor Live Database Ground Truth Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4 font-mono">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Database Obs</span>
          <span className="font-black text-slate-900 flex items-center gap-1 mt-0.5">
            <Database className="h-3 w-3 text-purple-600" />
            {selectedRoute.count ? selectedRoute.count.toLocaleString("en-IN") : "1,000+"} records
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Live Avg Fare</span>
          <span className="font-black text-purple-700 text-sm mt-0.5 block">
            ₹{selectedRoute.benchmark.toLocaleString("en-IN")}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Scraped Min / Max</span>
          <span className="font-bold text-slate-800 mt-0.5 block">
            ₹{selectedRoute.minFare?.toLocaleString("en-IN") || "1,000"} – ₹{selectedRoute.maxFare?.toLocaleString("en-IN") || "25,000"}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Route Base Value</span>
          <span className="font-bold text-slate-800 mt-0.5 block">
            ₹{selectedRoute.baseFare?.toLocaleString("en-IN") || selectedRoute.benchmark.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Airline and Flight Detail Grid (3 Columns: Carrier, Lead Days, Stops) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        {/* Carrier */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <AirlineLogo airline={airline} size="xs" />
            Operating Carrier
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3 pointer-events-none z-10">
              <AirlineLogo airline={airline} size="xs" />
            </div>
            <select
              value={airline}
              onChange={(e) => {
                const val = e.target.value;
                setAirline(val);
                runPrediction(selectedRoute, val, daysToDeparture, currentPrice, stops, durationMinutes);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 font-medium focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-xs"
            >
              {AIRLINES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Days to Departure */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              Lead Days (T-Minus)
            </label>
            <span className="font-mono font-black text-purple-700">
              {daysToDeparture} {daysToDeparture === 1 ? "day" : "days"}
            </span>
          </div>
          <div className="pt-2">
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
              className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Stops */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Stops</label>
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
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  stops === s.val
                    ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs font-medium"
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
        <div className="rounded-2xl bg-purple-50/60 border border-purple-200/80 p-5 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              14-Dimensional Engineered Feature Vector (Passed to Gradient Boosting Regressor)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              aura_ml.features.engineer
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {Object.entries(activeFeatures).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white border border-purple-100 p-2.5 shadow-xs">
                <div className="text-[10px] text-slate-500 font-medium truncate" title={k}>
                  {k}
                </div>
                <div className="text-xs font-mono font-black text-slate-900 mt-0.5">
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
