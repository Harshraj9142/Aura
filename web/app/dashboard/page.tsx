"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import SearchPanel from "@/components/SearchPanel";
import DashboardOverview from "@/components/DashboardOverview";
import FareChart from "@/components/FareChart";
import KpiCards from "@/components/KpiCards";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import LogPanel from "@/components/LogPanel";
import { FlightCard } from "@/components/ui/flight-card";
import {
  FareAnalyzeResult,
  RouteInfo,
  ApiLogEntry,
  analyzeFare,
  fetchAirlines,
  fetchRoutes,
  fetchLogs,
  runScraper,
} from "@/lib/api";
import { Activity, BarChart2, Terminal, Plane, Info, Clock, AlertTriangle, ArrowLeft } from "lucide-react";

const DEFAULT_AIRLINES = ["IndiGo", "Air India", "SpiceJet", "Akasa Air", "Air India Express"];

const AIRLINE_LOGOS: Record<string, string> = {
  "IndiGo": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/IndiGo_airlines_logo.svg/200px-IndiGo_airlines_logo.svg.png",
  "Air India": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Air_India_logo.svg/200px-Air_India_logo.svg.png",
  "SpiceJet": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/SpiceJet_logo.svg/200px-SpiceJet_logo.svg.png",
  "Akasa Air": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Akasa_Air_logo.svg/200px-Akasa_Air_logo.svg.png",
  "Air India Express": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Air_India_logo.svg/200px-Air_India_logo.svg.png",
};

type Tab = "overview" | "chart" | "flights" | "logs";

export default function DashboardPage() {
  const [analyzeState, setAnalyzeState] = useState<"idle" | "loading" | "done" | "no-data">("idle");
  const [scraperLoading, setScraperLoading] = useState(false);
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [airlines, setAirlines] = useState<string[]>(DEFAULT_AIRLINES);
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [origin, setOrigin] = useState("DEL");
  const [destination, setDestination] = useState("BOM");
  const [airline, setAirline] = useState("IndiGo");

  const [result, setResult] = useState<FareAnalyzeResult | null>(null);

  useEffect(() => {
    fetchRoutes().then(setRoutes).catch(console.error);
    fetchAirlines().then((a) => {
      if (a?.length > 0) setAirlines(a);
    }).catch(console.error);
    fetchLogs().then(setLogs).catch(console.error);
  }, []);

  useEffect(() => {
    if (analyzeState === "done" || analyzeState === "no-data") {
      fetchLogs().then(setLogs).catch(console.error);
    }
  }, [analyzeState]);

  const handleRunScraper = async () => {
    setScraperLoading(true);
    try {
      const res = await runScraper();
      alert(res.message);
      fetchLogs().then(setLogs).catch(console.error);
      fetchRoutes().then(setRoutes).catch(console.error);
    } catch (err: any) {
      alert("Please trigger the scraper CLI: python main.py --run-now");
    } finally {
      setScraperLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!origin || !destination || !airline) return;
    setAnalyzeState("loading");
    setActiveTab("overview");
    try {
      const data = await analyzeFare(origin, destination, airline);
      if (!data) {
        setResult(null);
        setAnalyzeState("no-data");
      } else {
        setResult(data);
        setAnalyzeState("done");
      }
    } catch (err: any) {
      console.warn("Analysis error:", err);
      setResult(null);
      setAnalyzeState("no-data");
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: "chart", label: "Fare History", icon: <Activity className="w-3.5 h-3.5" /> },
    { id: "flights", label: "Recorded Flights", icon: <Plane className="w-3.5 h-3.5" /> },
    { id: "logs", label: "Telemetry", icon: <Terminal className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <Header onRunScraper={handleRunScraper} scraperLoading={scraperLoading} />

      {/* IDLE / LOADING VIEW */}
      {(analyzeState === "idle" || analyzeState === "loading") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <SearchPanel
                routes={routes}
                airlines={airlines}
                origin={origin}
                destination={destination}
                airline={airline}
                onOriginChange={setOrigin}
                onDestinationChange={setDestination}
                onAirlineChange={setAirline}
                onAnalyze={handleAnalyze}
                loading={analyzeState === "loading"}
              />
            </div>
            <div className="lg:col-span-8">
              {analyzeState === "loading" ? (
                <div className="h-72 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col items-center justify-center space-y-4">
                  <Activity className="w-8 h-8 animate-spin text-emerald-400" />
                  <p className="text-slate-300 font-medium font-mono animate-pulse text-sm">
                    Querying PostgreSQL database for {origin} → {destination} ({airline})…
                  </p>
                </div>
              ) : (
                <DashboardOverview />
              )}
            </div>
          </div>
      )}

      {/* NO DATA FOUND VIEW (Strict Database Mode Empty State) */}
      {analyzeState === "no-data" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <SearchPanel
              routes={routes}
              airlines={airlines}
              origin={origin}
              destination={destination}
              airline={airline}
              onOriginChange={setOrigin}
              onDestinationChange={setDestination}
              onAirlineChange={setAirline}
              onAnalyze={handleAnalyze}
              loading={false}
            />
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    No Scraped Records in Database
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Route: <span className="font-mono text-slate-200 font-semibold">{origin} → {destination}</span> · Carrier: <span className="font-mono text-slate-200 font-semibold">{airline}</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                <strong>Strict Database Mode</strong> is active. Synthetic fallback generation and mock observations are disabled. The database does not currently contain verified fare rows matching this query.
              </p>

              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-2">
                <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  To ingest records for this route, run:
                </p>
                <div className="bg-black/80 rounded border border-slate-800 p-3 font-mono text-xs text-emerald-400 select-all overflow-x-auto">
                  python main.py --run-now --route {origin}-{destination}
                </div>
              </div>

              <button
                onClick={() => setAnalyzeState("idle")}
                className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white border border-slate-800 rounded-lg px-4 py-2.5 bg-slate-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Overview</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DONE VIEW (Real Database Records Found) */}
      {analyzeState === "done" && result && (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left search controls */}
          <aside className="lg:w-[320px] shrink-0 space-y-4 lg:sticky lg:top-24">
            <SearchPanel
              routes={routes}
              airlines={airlines}
              origin={origin}
              destination={destination}
              airline={airline}
              onOriginChange={setOrigin}
              onDestinationChange={setDestination}
              onAirlineChange={setAirline}
              onAnalyze={handleAnalyze}
              loading={false}
            />

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
                Database Query Details
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Route</span>
                  <span className="font-mono font-semibold text-slate-200">{result.route}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Carrier</span>
                  <span className="font-mono font-semibold text-slate-200">{result.airline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Records Found</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {result.analytics.totalObservations || result.historicalData.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Source</span>
                  <span className="font-mono text-[11px] text-right text-slate-300 truncate max-w-[150px]">
                    {result.dataSource}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setAnalyzeState("idle");
                setResult(null);
              }}
              className="w-full text-xs text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg py-2.5 bg-slate-900/60 transition-colors"
            >
              ← Back to Overview
            </button>
          </aside>

          {/* Main Content Tabs */}
          <main className="flex-1 min-w-0 space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-1.5 flex flex-wrap gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <KpiCards data={result} />
                <AnalyticsPanel trend={result.trend} />

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Info className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-slate-200">
                      Methodology: Fisher Ideal Price Index Calculation
                    </h3>
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed space-y-3">
                    <p>
                      Calculated from verified PostgreSQL records. The APIx index represents the geometric mean of observed Laspeyres and Paasche aggregations across active domestic advance purchase windows (1d, 7d, 15d, 30d, 45d).
                    </p>
                    <p className="font-mono text-[11px] text-emerald-400">
                      Strict Mode Active · Zero Synthetic Data Points
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CHART TAB */}
            {activeTab === "chart" && (
              <div className="space-y-6">
                <FareChart
                  data={result.historicalData}
                  thirtyDayAvg={result.analytics.thirtyDayAverage}
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800 border border-slate-800 rounded-xl overflow-hidden">
                  {[
                    {
                      label: "Min Observed",
                      value: `₹${result.analytics.minimumFare.toLocaleString("en-IN")}`,
                      cls: "text-emerald-400",
                    },
                    {
                      label: "Max Observed",
                      value: `₹${result.analytics.maximumFare.toLocaleString("en-IN")}`,
                      cls: "text-red-400",
                    },
                    {
                      label: "Spread",
                      value: `₹${(
                        result.analytics.maximumFare - result.analytics.minimumFare
                      ).toLocaleString("en-IN")}`,
                      cls: "text-slate-200",
                    },
                    {
                      label: "Volatility",
                      value: result.trend.volatility,
                      cls:
                        result.trend.volatility === "HIGH"
                          ? "text-red-400"
                          : result.trend.volatility === "MODERATE"
                          ? "text-amber-400"
                          : "text-emerald-400",
                    },
                  ].map((s) => (
                    <div key={s.label} className="bg-slate-950 px-5 py-4">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        {s.label}
                      </p>
                      <p className={`text-xl font-bold font-mono ${s.cls}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FLIGHTS TAB (Real Database Records) */}
            {activeTab === "flights" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">
                      Database Records: {result.route}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Showing {result.flights.length} verified rows from PostgreSQL `fares` table
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Spot Avg:{" "}
                    <span className="text-slate-100 font-semibold">
                      ₹{result.currentFare.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {result.flights.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono py-8 text-center">
                    No individual flight records available.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {result.flights.map((f, i) => (
                      <FlightCard
                        key={f.id || i}
                        airline={{
                          name: result.airline,
                          logo: AIRLINE_LOGOS[result.airline] ?? "",
                          flightNumber: f.flightNumber,
                        }}
                        departureTime={f.departureTime}
                        arrivalTime={f.arrivalTime}
                        duration={f.duration}
                        stops={f.stops}
                        price={f.price}
                        currency={f.currency}
                        offer={f.isOutlier ? "⚠️ Flagged Outlier" : undefined}
                        refundableType={f.fareClass}
                        onBook={() =>
                          alert(
                            `Verified Database Row:\nFlight: ${f.flightNumber}\nFare: ₹${f.price.toLocaleString("en-IN")}\nSource: ${f.source}\nTravel Date: ${f.travelDate}`
                          )
                        }
                        onFlightDetails={() =>
                          alert(
                            `DB Row Details:\nID: ${f.id}\nFlight Number: ${f.flightNumber}\nTotal Fare: ₹${f.price}\nTravel Date: ${f.travelDate}\nSource: ${f.source}\nIs Outlier: ${f.isOutlier}`
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TELEMETRY TAB */}
            {activeTab === "logs" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-1">
                    Database Telemetry (Scrape Runs)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real scrape run events queried from `scrape_runs` table
                  </p>
                </div>
                <LogPanel logs={logs} />
                <button
                  onClick={() => fetchLogs().then(setLogs).catch(console.error)}
                  className="text-xs text-slate-300 hover:text-white border border-slate-800 rounded-lg px-4 py-2 bg-slate-900/60 transition-colors"
                >
                  ↻ Refresh Telemetry
                </button>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
