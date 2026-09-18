"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { 
  Activity, 
  Database, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  RefreshCw, 
  Server,
  Zap,
  Radio,
  Wifi,
  ShieldCheck,
  Plane
} from "lucide-react";

interface HealthData {
  system: {
    service: string;
    status: string;
    uptimeCheckedAt: string;
    database: {
      connected: boolean;
      latencyMs: number;
      engine: string;
    };
  };
  dataVolume: {
    totalFares: number;
    faresToday: number;
  };
  latestScrapeRun: {
    runId: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    attempted: number;
    success: number;
    failed: number;
    blocked: number;
    successRatePct: number;
  } | null;
  telemetry: {
    errorCountLast24h: number;
    breakdownBySourceAndStatus: Array<{
      source: string;
      status: string;
      error_type: string | null;
      count: number;
    }>;
    recentIncidents: Array<{
      id: string;
      created_at: string;
      source: string;
      route_origin: string;
      route_destination: string;
      advance_purchase_days: number;
      status: string;
      error_type: string | null;
      error_message: string | null;
      duration_seconds: number | null;
    }>;
  };
}

export default function HealthDashboardPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/health/dashboard");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch health dashboard data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastRefreshed(new Date());
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen w-full font-body flex flex-col justify-between">
      {/* 
        Aura Blurred Custom Cloud Background
      */}
      <div
        className="fixed inset-0 h-full w-full bg-[url('/landing/custom_cloud_bg.png')] bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{
          filter: "blur(18px) brightness(1.02)",
          transform: "scale(1.08)",
        }}
      />

      {/* Main Content Layout */}
      <div className="relative z-10 flex min-h-screen flex-col justify-between">
        <Header />

        <main className="flex-1 w-full pt-28 pb-16 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-[1700px] mx-auto space-y-8">
          {/* Header Title Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/80 shadow-lg">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900/5 border border-slate-200/60 shadow-xs">
                  <Activity className="h-6 w-6 text-[#08080D]" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#08080D] font-heading flex items-center gap-3">
                    System Health & Telemetry Engine
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE TELEMETRY
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Real-time operational health, Neon PostgreSQL latency, anti-bot circuit breakers, and rate-limit diagnostics.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <button
                onClick={fetchHealth}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs hover:shadow-sm transition-all"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#08080D]" : ""}`} />
                Last ping: {lastRefreshed.toLocaleTimeString()}
              </button>
            </div>
          </div>

          {/* Top 4 Glassmorphic KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {/* Card 1: Database Engine */}
            <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 border border-slate-200/50">
                    <Database className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                    PostgreSQL Engine
                  </span>
                </div>
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#08080D] font-mono">
                  {data?.system?.database?.connected ? "Connected" : loading ? "Checking..." : "Offline"}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-mono">
                  <Wifi className="h-3 w-3" />
                  {data?.system?.database?.latencyMs ?? "—"} ms
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-500 font-mono">
                Neon Serverless Pooler (us-east-2)
              </div>
            </div>

            {/* Card 2: Total Airfares */}
            <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 border border-slate-200/50">
                    <TrendingUp className="h-5 w-5 text-cyan-600" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                    Total Fares Stored
                  </span>
                </div>
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D] font-mono">
                  {data?.dataVolume?.totalFares?.toLocaleString("en-IN") ?? "—"}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200 font-mono">
                  +{data?.dataVolume?.faresToday?.toLocaleString("en-IN") ?? 0}
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-500 font-mono">
                Historical records in Neon PostgreSQL
              </div>
            </div>

            {/* Card 3: Batch Run Yield */}
            <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 border border-slate-200/50">
                    <Zap className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                    Batch Completion
                  </span>
                </div>
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D] font-mono">
                  {data?.latestScrapeRun ? `${data.latestScrapeRun.successRatePct}%` : "100%"}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {data?.latestScrapeRun?.success ?? 0}/{data?.latestScrapeRun?.attempted ?? 0} tasks
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-500 font-mono truncate">
                Status: {data?.latestScrapeRun?.status?.toUpperCase() ?? "COMPLETED"}
              </div>
            </div>

            {/* Card 4: 24h Error Interceptions */}
            <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 border border-slate-200/50">
                    <ShieldAlert className="h-5 w-5 text-rose-600" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                    24h Interceptions
                  </span>
                </div>
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D] font-mono">
                  {data?.telemetry?.errorCountLast24h ?? 0}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-mono">
                  Telemetries
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-500 font-mono">
                Rate-limits, blocks & timeouts logged
              </div>
            </div>
          </div>

          {/* Section: Source Telemetry Breakdown Cards */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 border border-slate-200/50">
                  <Radio className="h-5 w-5 text-[#08080D]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#08080D] font-heading">
                    Source Health & Circuit Breaker Telemetry (Past 24 Hours)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real-time aggregated telemetry records stored in Neon PostgreSQL
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400">Neon DB sync</span>
            </div>

            {(!data?.telemetry?.breakdownBySourceAndStatus || data.telemetry.breakdownBySourceAndStatus.length === 0) ? (
              <div className="py-10 text-center text-slate-500 text-sm font-mono border border-dashed border-slate-200 rounded-2xl bg-white/40">
                ✓ Zero error records in the past 24 hours. All operational sources executing cleanly without interruptions!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.telemetry.breakdownBySourceAndStatus.map((item, idx) => (
                  <div key={idx} className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-xs hover:shadow-md transition-all space-y-3 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#08080D] uppercase tracking-wide">{item.source}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === "blocked" ? "bg-red-50 text-red-700 border border-red-200" :
                        item.status === "timeout" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs">
                      <span className="text-slate-500">{item.error_type || "general"}</span>
                      <span className="font-bold text-[#08080D]">{item.count} events</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Granular Error Telemetry Table */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 border border-slate-200/50">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#08080D] font-heading">
                    Recent Telemetry Incidents Log
                  </h2>
                  <p className="text-xs text-slate-500">
                    Granular diagnostics logged to <code className="font-mono text-[#08080D]">scrape_error_logs</code> for AI learning and selector debugging
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="py-3.5 px-6 font-semibold">Timestamp (UTC)</th>
                    <th className="py-3.5 px-6 font-semibold">Source</th>
                    <th className="py-3.5 px-6 font-semibold">Route</th>
                    <th className="py-3.5 px-6 font-semibold">Window</th>
                    <th className="py-3.5 px-6 font-semibold">Status</th>
                    <th className="py-3.5 px-6 font-semibold">Error Type</th>
                    <th className="py-3.5 px-6 font-semibold">Duration</th>
                    <th className="py-3.5 px-6 font-semibold">Diagnostic Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-slate-700 bg-white/60">
                  {(!data?.telemetry?.recentIncidents || data.telemetry.recentIncidents.length === 0) ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No error logs recorded. The scraping engine is operating cleanly.
                      </td>
                    </tr>
                  ) : (
                    data.telemetry.recentIncidents.map((incident) => (
                      <tr key={incident.id} className="hover:bg-white/90 transition-colors">
                        <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                          {new Date(incident.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 font-bold text-[#08080D] uppercase whitespace-nowrap">
                          {incident.source}
                        </td>
                        <td className="py-4 px-6 font-semibold text-cyan-700 whitespace-nowrap">
                          {incident.route_origin}-{incident.route_destination}
                        </td>
                        <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                          T+{incident.advance_purchase_days}d
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            incident.status === "blocked" ? "bg-red-50 text-red-700 border border-red-200" :
                            incident.status === "timeout" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {incident.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                          {incident.error_type || "—"}
                        </td>
                        <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                          {incident.duration_seconds ? `${incident.duration_seconds}s` : "—"}
                        </td>
                        <td className="py-4 px-6 text-slate-700 max-w-sm truncate" title={incident.error_message || ""}>
                          {incident.error_message || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <LandingFooter />
      </div>
    </div>
  );
}
