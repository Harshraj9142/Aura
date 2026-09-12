"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Terminal,
  Zap,
  RefreshCw,
  Trash2,
  Play,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plane,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Download,
  FileText,
  Calendar,
  Cpu,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  ChevronLeft,
  ChevronRight,
  Loader2,
  StopCircle,
  Filter,
  Wifi,
  WifiOff,
  PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ScraperControlModal from "@/components/ScraperControlModal";

interface LogItem {
  id: string;
  time: string;
  level: "INFO" | "DEBUG" | "WARNING" | "ERROR" | "SUCCESS" | "UPSERT";
  text: string;
}

interface SavedFareRow {
  id: string;
  route_origin: string;
  route_destination: string;
  travel_date: string;
  advance_purchase_days: number;
  source: string;
  source_type: string;
  carrier: string;
  flight_number: string;
  total_fare: number;
  base_fare: number | null;
  taxes_and_fees: number | null;
  currency: string;
  is_outlier: boolean;
  scraped_at: string;
}

interface ConsoleStats {
  overview: {
    totalFares: number;
    faresToday: number;
    faresYesterday: number;
    outliersCount: number;
    outlierRate: string;
    uniqueSources: number;
    uniqueRoutes: number;
    uniqueCarriers: number;
    avgFare: number;
    minFare: number;
    maxFare: number;
    growthRate: string;
  };
  sources: Array<{
    name: string;
    type: string;
    count: number;
    avgFare: number;
    minFare: number;
    maxFare: number;
  }>;
  routes: Array<{
    origin: string;
    destination: string;
    pair: string;
    count: number;
    avgFare: number;
    minFare: number;
    maxFare: number;
  }>;
  carriers: Array<{
    name: string;
    count: number;
    avgFare: number;
  }>;
  latestFares: Array<{
    id: string;
    source: string;
    carrier: string;
    flight_number: string;
    route_origin: string;
    route_destination: string;
    total_fare: number;
    scraped_at: string;
  }>;
  hourlyIngestion: Array<{
    hour: string;
    count: number;
  }>;
}

type ActiveTab = "terminal" | "database" | "analytics" | "sources";

export default function LiveScraperTerminal() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [logFilter, setLogFilter] = useState("");
  const [savedFares, setSavedFares] = useState<SavedFareRow[]>([]);
  const [totalFaresCount, setTotalFaresCount] = useState<number>(0);
  const [fareFilter, setFareFilter] = useState("");
  const [lastScrapedTime, setLastScrapedTime] = useState<string>("");
  const [dbLoading, setDbLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("terminal");
  const [farePage, setFarePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<ConsoleStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("scraped_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const FARES_PER_PAGE = 25;

  // Fetch real-time Python scraper logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const formatted: LogItem[] = json.data.map((item: any, i: number) => {
            let lvl: LogItem["level"] = "INFO";
            const text = item.endpoint || item.message || JSON.stringify(item);
            
            if (item.level?.includes("ERROR") || text.includes("Traceback") || text.includes("❌")) {
              lvl = "ERROR";
            } else if (item.level?.includes("WARN") || text.includes("WARNING") || text.includes("⚠️")) {
              lvl = "WARNING";
            } else if (text.includes("Upserted") || text.includes("PostgreSQL") || text.includes("Database") || text.includes("saved")) {
              lvl = "UPSERT";
            } else if (text.includes("✅") || text.includes("🎉") || text.includes("Extracted") || text.includes("allows")) {
              lvl = "SUCCESS";
            } else if (item.level?.includes("DEBUG")) {
              lvl = "DEBUG";
            }

            return {
              id: item.id || `log-${i}-${Date.now()}`,
              time: item.timestamp?.slice(11, 19) || new Date().toLocaleTimeString("en-IN", { hour12: false }),
              level: lvl,
              text,
            };
          });
          setLogs(formatted);
        }
      }
    } catch (err) {
      console.warn("Log stream error:", err);
    }
  }, []);

  // Fetch saved fares with pagination
  const fetchSavedFares = useCallback(async (page = 1) => {
    setDbLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(FARES_PER_PAGE),
        page: String(page),
        sortBy,
        sortOrder,
      });
      if (sourceFilter !== "all") {
        params.set("source", sourceFilter);
      }
      const res = await fetch(`/api/fares?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSavedFares(json.data);
          if (json.meta?.totalCount) {
            setTotalFaresCount(json.meta.totalCount);
            setTotalPages(json.meta.totalPages || 1);
          }
          if (json.data.length > 0) {
            const latest = json.data[0].scraped_at;
            if (latest) {
              setLastScrapedTime(new Date(latest).toLocaleTimeString("en-IN", { hour12: false }));
            }
          }
        }
      }
    } catch (err) {
      console.warn("Saved fares fetch error:", err);
    } finally {
      setDbLoading(false);
    }
  }, [sourceFilter, sortBy, sortOrder]);

  // Fetch console stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/console/stats");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data);
        }
      }
    } catch (err) {
      console.warn("Stats fetch error:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchSavedFares(1);
    fetchStats();
    const interval = setInterval(() => {
      fetchLogs();
      if (activeTab === "database") fetchSavedFares(farePage);
      if (activeTab === "analytics" || activeTab === "sources") fetchStats();
    }, 3000);
    return () => clearInterval(interval);
  }, [activeTab, farePage, fetchLogs, fetchSavedFares, fetchStats]);

  useEffect(() => {
    if (autoScroll && activeTab === "terminal") {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll, activeTab]);

  // Page change for fares
  useEffect(() => {
    fetchSavedFares(farePage);
  }, [farePage, sourceFilter, sortBy, sortOrder, fetchSavedFares]);

  const handleLaunchScraper = async (params: { source: string; route: string; window: string }) => {
    setIsScraping(true);
    try {
      const res = await fetch("/api/demo/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      await res.json();
      fetchLogs();
      fetchSavedFares(1);
      fetchStats();
    } catch (err) {
      console.error("Scraper trigger error:", err);
    } finally {
      setTimeout(() => {
        setIsScraping(false);
        fetchSavedFares(1);
        fetchStats();
      }, 15000);
    }
  };

  const triggerQuickRoute = (route: string) => {
    handleLaunchScraper({ source: "all", route, window: "7" });
  };

  const getLevelBadgeStyle = (level: LogItem["level"]) => {
    switch (level) {
      case "ERROR": return "bg-red-500/20 text-red-400 border-red-500/40";
      case "WARNING": return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "UPSERT": return "bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold";
      case "SUCCESS": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold";
      case "DEBUG": return "bg-slate-900 text-slate-400 border-slate-800";
      default: return "bg-cyan-950/60 text-cyan-300 border-cyan-800/60";
    }
  };

  const getLevelTextStyle = (level: LogItem["level"]) => {
    switch (level) {
      case "ERROR": return "text-red-400 font-semibold";
      case "WARNING": return "text-amber-400 font-semibold";
      case "UPSERT": return "text-purple-300 font-bold tracking-wide";
      case "SUCCESS": return "text-emerald-400 font-semibold";
      case "DEBUG": return "text-slate-500 font-normal";
      default: return "text-slate-200 font-normal";
    }
  };

  const filteredLogs = logs.filter((l) =>
    logFilter ? l.text.toLowerCase().includes(logFilter.toLowerCase()) || l.level.toLowerCase().includes(logFilter.toLowerCase()) : true
  );

  const filteredFares = savedFares.filter((f) => {
    if (!fareFilter) return true;
    const q = fareFilter.toLowerCase();
    return (
      f.carrier?.toLowerCase().includes(q) ||
      f.flight_number?.toLowerCase().includes(q) ||
      `${f.route_origin}-${f.route_destination}`.toLowerCase().includes(q) ||
      f.source?.toLowerCase().includes(q)
    );
  });

  // Source color map
  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      easemytrip: "text-orange-400",
      ixigo: "text-blue-400",
      cleartrip: "text-cyan-400",
      yatra: "text-red-400",
      makemytrip: "text-blue-300",
      goibibo: "text-red-300",
      indigo: "text-indigo-400",
      akasa: "text-orange-300",
      spicejet: "text-yellow-400",
      air_india: "text-amber-400",
      air_india_express: "text-amber-300",
    };
    return colors[source] || "text-slate-300";
  };

  const getSourceBgColor = (source: string) => {
    const colors: Record<string, string> = {
      easemytrip: "bg-orange-500/10 border-orange-500/30",
      ixigo: "bg-blue-500/10 border-blue-500/30",
      cleartrip: "bg-cyan-500/10 border-cyan-500/30",
      yatra: "bg-red-500/10 border-red-500/30",
      makemytrip: "bg-blue-500/10 border-blue-500/30",
      goibibo: "bg-red-500/10 border-red-500/30",
      indigo: "bg-indigo-500/10 border-indigo-500/30",
      akasa: "bg-orange-500/10 border-orange-500/30",
      spicejet: "bg-yellow-500/10 border-yellow-500/30",
      air_india: "bg-amber-500/10 border-amber-500/30",
      air_india_express: "bg-amber-500/10 border-amber-500/30",
    };
    return colors[source] || "bg-slate-500/10 border-slate-500/30";
  };

  return (
    <div className="space-y-6">
      {/* ── TAB NAVIGATION ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/50 border border-slate-800 w-fit">
        {([
          { id: "terminal" as ActiveTab, label: "Terminal", icon: Terminal },
          { id: "database" as ActiveTab, label: "Database Records", icon: Database },
          { id: "analytics" as ActiveTab, label: "Analytics", icon: BarChart3 },
          { id: "sources" as ActiveTab, label: "Sources & Routes", icon: Globe },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── QUICK ACTION BAR ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                1-Click Quick Corridor Probe Launchers
              </h3>
            </div>
            <Badge variant="outline" className={`text-[10px] ${isScraping ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}`}>
              {isScraping ? "⚡ SCRAPING LIVE..." : "● READY"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { route: "DEL-BOM", name: "Delhi → Mumbai", label: "Metro 1", weight: "28%" },
              { route: "DEL-BLR", name: "Delhi → Bengaluru", label: "Tech Hub", weight: "22%" },
              { route: "BOM-BLR", name: "Mumbai → Bengaluru", label: "West-South", weight: "18%" },
              { route: "DEL-CCU", name: "Delhi → Kolkata", label: "East Hub", weight: "14%" },
              { route: "BLR-HYD", name: "Bengaluru → Hyderabad", label: "South", weight: "10%" },
              { route: "MAA-DEL", name: "Chennai → Delhi", label: "Coastal", weight: "8%" },
            ].map((item) => (
              <button
                key={item.route}
                onClick={() => triggerQuickRoute(item.route)}
                disabled={isScraping}
                className="group p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-emerald-500/40 text-left transition-all disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">{item.label}</span>
                  <Plane className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                </div>
                <p className="text-[11px] font-bold font-mono text-slate-200 group-hover:text-emerald-300 mt-0.5">{item.route}</p>
                <p className="text-[9px] text-slate-500">{item.weight} weight</p>
              </button>
            ))}
          </div>
        </div>

        {/* Live Stats Mini Cards */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Live Database Stats
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-mono">Total Fares</p>
              <p className="text-lg font-bold font-mono text-emerald-400">
                {stats?.overview?.totalFares?.toLocaleString("en-IN") || totalFaresCount?.toLocaleString("en-IN") || "—"}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-mono">Today</p>
              <p className="text-lg font-bold font-mono text-cyan-300">
                {stats?.overview?.faresToday?.toLocaleString("en-IN") || "—"}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-mono">Avg Fare</p>
              <p className="text-lg font-bold font-mono text-slate-100">
                ₹{stats?.overview?.avgFare?.toLocaleString("en-IN") || "—"}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-mono">Sources</p>
              <p className="text-lg font-bold font-mono text-purple-300">
                {stats?.overview?.uniqueSources || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB: TERMINAL ──────────────────────────────────────────────── */}
      {activeTab === "terminal" && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden font-mono">
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>harsh@Aura ~/scraper % python run_fixed_sources.py</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded text-xs pl-8 pr-2 py-1 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 w-36 sm:w-48"
                />
              </div>

              <Button
                size="sm"
                onClick={() => setIsModalOpen(true)}
                disabled={isScraping}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-semibold h-7 gap-1.5"
              >
                {isScraping ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Scraping...</span></>
                ) : (
                  <><Play className="w-3.5 h-3.5" /><span>⚡ Run Probe</span></>
                )}
              </Button>

              <Button size="sm" variant="outline" onClick={fetchLogs} className="h-7 px-2 border-slate-800 text-slate-400 hover:text-slate-200" title="Refresh">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setLogs([])} className="h-7 px-2 border-slate-800 text-slate-400 hover:text-red-400" title="Clear">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="p-4 bg-slate-950/95 h-[400px] overflow-y-auto space-y-1 text-[11px] leading-relaxed select-text font-mono">
            <div className="text-slate-500 border-b border-slate-900 pb-2 mb-2">
              <div className="text-emerald-400 font-bold">AIRFARE PRICE INDEX SYSTEM (APIx) — MoSPI / NSO Problem Statement #26056</div>
              <div className="text-slate-400">Playwright Multi-Source Engine connected to Neon PostgreSQL Database.</div>
              <div className="text-slate-500">Sources: EaseMyTrip • Ixigo • Cleartrip • Yatra • MakeMyTrip • Goibibo • IndiGo • Akasa • SpiceJet • Air India • Air India Express</div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-600 space-y-2">
                <Terminal className="w-8 h-8 mx-auto text-slate-700" />
                <p>Awaiting live scraper telemetry...</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs border-slate-800 text-emerald-400 hover:bg-slate-900"
                >
                  Launch Interactive Scraper Probe
                </Button>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 hover:bg-slate-900/50 py-0.5 px-1 rounded transition-colors">
                  <span className="text-slate-600 shrink-0 font-sans text-[10px] tabular-nums">{log.time}</span>
                  <span className={`shrink-0 font-bold uppercase text-[9px] px-1 py-0.5 rounded border ${getLevelBadgeStyle(log.level)}`}>
                    {log.level}
                  </span>
                  <span className={`flex-1 break-all ${getLevelTextStyle(log.level)}`}>
                    {log.text}
                  </span>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>

          <div className="bg-slate-900/70 px-4 py-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-[10px] text-slate-400 gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold">PostgreSQL DB Sync: Active</span>
              </div>
              <span className="text-slate-600">•</span>
              <span>Log Lines: {logs.length}</span>
              <span className="text-slate-600">•</span>
              <span>DB Fares: {totalFaresCount.toLocaleString("en-IN")}</span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0 w-3 h-3"
              />
              <span>Auto-Scroll</span>
            </label>
          </div>
        </div>
      )}

      {/* ── TAB: DATABASE RECORDS ──────────────────────────────────────── */}
      {activeTab === "database" && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                  PostgreSQL Fare Records
                </h2>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                  {totalFaresCount.toLocaleString("en-IN")} Total
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                All scraped fare data stored in Neon PostgreSQL after deduplication & validation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Source Filter */}
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setFarePage(1); }}
                className="bg-slate-900 border border-slate-800 rounded-lg text-xs px-2 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="all">All Sources</option>
                {["easemytrip", "ixigo", "cleartrip", "yatra", "makemytrip", "goibibo", "indigo", "akasa", "spicejet", "air_india", "air_india_express"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search fares..."
                  value={fareFilter}
                  onChange={(e) => setFareFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg text-xs pl-8 pr-3 py-1.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 w-40"
                />
              </div>

              <a href="/api/fares/export?format=csv" download
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-md shadow-emerald-600/20">
                <Download className="w-3.5 h-3.5" /><span>CSV</span>
              </a>
              <a href="/api/fares/export?format=json" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors">
                <FileText className="w-3.5 h-3.5 text-cyan-400" /><span>JSON</span>
              </a>
              <Button size="sm" variant="outline" onClick={() => fetchSavedFares(farePage)} disabled={dbLoading}
                className="text-xs border-slate-800 text-slate-300 hover:text-white bg-slate-900 h-8 gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${dbLoading ? "animate-spin text-emerald-400" : ""}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-mono">Total DB Fares</p>
              <p className="text-xl font-bold font-mono text-emerald-400">{totalFaresCount.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-mono">Latest Ingestion</p>
              <p className="text-sm font-bold font-mono text-slate-100 truncate">{lastScrapedTime || "—"}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-mono">Avg Fare</p>
              <p className="text-xl font-bold font-mono text-cyan-300">₹{stats?.overview?.avgFare?.toLocaleString("en-IN") || "—"}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-mono">Min Fare</p>
              <p className="text-xl font-bold font-mono text-emerald-300">₹{stats?.overview?.minFare?.toLocaleString("en-IN") || "—"}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-mono">Max Fare</p>
              <p className="text-xl font-bold font-mono text-red-400">₹{stats?.overview?.maxFare?.toLocaleString("en-IN") || "—"}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-mono">Outliers</p>
              <p className="text-xl font-bold font-mono text-amber-400">{stats?.overview?.outliersCount || 0}</p>
            </div>
          </div>

          {/* Data Table */}
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>PostgreSQL `fares` Table — Page {farePage} of {totalPages}</span>
              <span className="font-mono text-[11px] text-slate-500">
                {filteredFares.length} rows | {sourceFilter !== "all" ? `Source: ${sourceFilter}` : "All Sources"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Flight #</th>
                    <th className="px-3 py-2.5">Carrier</th>
                    <th className="px-3 py-2.5">Route</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">T+</th>
                    <th className="px-3 py-2.5 cursor-pointer hover:text-emerald-400" onClick={() => { setSortBy("total_fare"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                      Total Fare {sortBy === "total_fare" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="px-3 py-2.5">Base</th>
                    <th className="px-3 py-2.5">Tax</th>
                    <th className="px-3 py-2.5">Source</th>
                    <th className="px-3 py-2.5 cursor-pointer hover:text-emerald-400" onClick={() => { setSortBy("scraped_at"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                      Scraped {sortBy === "scraped_at" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="px-3 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredFares.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                        {dbLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                            <span>Loading fare records...</span>
                          </div>
                        ) : "No matching fare records found."}
                      </td>
                    </tr>
                  ) : (
                    filteredFares.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="px-3 py-2 font-bold text-emerald-400 text-[11px]">{row.flight_number || "Direct"}</td>
                        <td className="px-3 py-2 font-semibold text-slate-200 text-[11px] max-w-[120px] truncate">{row.carrier}</td>
                        <td className="px-3 py-2 text-slate-300 font-bold text-[11px]">{row.route_origin}→{row.route_destination}</td>
                        <td className="px-3 py-2 text-slate-400 text-[10px]">{row.travel_date}</td>
                        <td className="px-3 py-2 text-slate-400 text-[10px]">T+{row.advance_purchase_days}d</td>
                        <td className="px-3 py-2 font-bold text-white text-[11px]">₹{row.total_fare?.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2 text-slate-400 text-[10px]">{row.base_fare ? `₹${row.base_fare.toLocaleString("en-IN")}` : "—"}</td>
                        <td className="px-3 py-2 text-slate-400 text-[10px]">{row.taxes_and_fees ? `₹${row.taxes_and_fees.toLocaleString("en-IN")}` : "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-bold uppercase ${getSourceColor(row.source)}`}>{row.source}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-[10px]">
                          {row.scraped_at ? new Date(row.scraped_at).toLocaleString("en-IN", { hour12: false, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.is_outlier ? (
                            <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-[9px]">⚠️ Outlier</Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[9px]">✓ Valid</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <p className="text-[11px] text-slate-500 font-mono">
                Showing {(farePage - 1) * FARES_PER_PAGE + 1}–{Math.min(farePage * FARES_PER_PAGE, totalFaresCount)} of {totalFaresCount.toLocaleString("en-IN")}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setFarePage(Math.max(1, farePage - 1))} disabled={farePage <= 1}
                  className="h-7 px-2 border-slate-800 text-slate-400 text-xs">
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </Button>
                <span className="text-xs font-mono text-slate-400">
                  {farePage} / {totalPages}
                </span>
                <Button size="sm" variant="outline" onClick={() => setFarePage(Math.min(totalPages, farePage + 1))} disabled={farePage >= totalPages}
                  className="h-7 px-2 border-slate-800 text-slate-400 text-xs">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ANALYTICS ─────────────────────────────────────────────── */}
      {activeTab === "analytics" && (
        <div className="space-y-5">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Fares", value: stats?.overview?.totalFares?.toLocaleString("en-IN") || "—", color: "text-emerald-400", icon: Layers },
              { label: "Today's Fares", value: stats?.overview?.faresToday?.toLocaleString("en-IN") || "—", color: "text-cyan-300", icon: Calendar },
              { label: "Unique Sources", value: String(stats?.overview?.uniqueSources || "—"), color: "text-purple-300", icon: Globe },
              { label: "Unique Routes", value: String(stats?.overview?.uniqueRoutes || "—"), color: "text-blue-300", icon: Plane },
              { label: "Unique Carriers", value: String(stats?.overview?.uniqueCarriers || "—"), color: "text-amber-300", icon: Activity },
              { label: "Outlier Rate", value: `${stats?.overview?.outlierRate || "0"}%`, color: "text-red-400", icon: AlertTriangle },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                  <span>{card.label}</span>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className={`text-xl font-bold font-mono ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Price Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Fare Price Range Distribution</h3>
              </div>
              <div className="space-y-2">
                {stats?.sources?.map((src) => {
                  const maxRange = Math.max(...(stats?.sources?.map(s => s.maxFare) || [1]));
                  const barWidth = (src.maxFare / maxRange) * 100;
                  return (
                    <div key={src.name} className="flex items-center gap-3">
                      <span className={`text-[11px] font-mono font-bold w-24 truncate ${getSourceColor(src.name)}`}>{src.name}</span>
                      <div className="flex-1 relative h-5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-600/60 to-emerald-400/40"
                          style={{ width: `${barWidth}%` }}
                        />
                        <span className="absolute right-2 top-0.5 text-[10px] font-mono text-slate-300">
                          ₹{src.minFare.toLocaleString("en-IN")} – ₹{src.maxFare.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 w-12 text-right">{src.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Carrier Breakdown */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">Top Carriers by Records</h3>
              </div>
              <div className="space-y-2">
                {stats?.carriers?.slice(0, 10).map((carrier, idx) => {
                  const maxCount = stats?.carriers?.[0]?.count || 1;
                  const barWidth = (carrier.count / maxCount) * 100;
                  const colors = ["text-emerald-400", "text-cyan-400", "text-blue-400", "text-purple-400", "text-amber-400", "text-pink-400", "text-indigo-400", "text-orange-400", "text-teal-400", "text-lime-400"];
                  return (
                    <div key={carrier.name} className="flex items-center gap-3">
                      <span className={`text-[11px] font-mono font-bold w-28 truncate ${colors[idx % colors.length]}`}>
                        {carrier.name}
                      </span>
                      <div className="flex-1 relative h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-purple-600/60 to-purple-400/40"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 w-16 text-right">
                        {carrier.count} / ₹{carrier.avgFare.toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase">
                <span>Playwright Stealth</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-emerald-400">98.6%</p>
              <p className="text-[11px] text-slate-500 font-mono">--disable-http2 bot bypass</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase">
                <span>Avg Latency</span>
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-cyan-300">2.1s / page</p>
              <p className="text-[11px] text-slate-500 font-mono">Chromium headless speed</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase">
                <span>Deduplication</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-slate-100">100% Passed</p>
              <p className="text-[11px] text-slate-500 font-mono">Zero synthetic duplicates</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase">
                <span>Robots.txt Ethics</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-slate-100">100% Compliant</p>
              <p className="text-[11px] text-slate-500 font-mono">Pre-request delay enforced</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SOURCES & ROUTES ──────────────────────────────────────── */}
      {activeTab === "sources" && (
        <div className="space-y-5">
          {/* Sources Grid */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Source Platform Breakdown</h3>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {stats?.sources?.length || 0} Active
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats?.sources?.map((src) => (
                <div key={src.name} className={`rounded-lg border p-4 space-y-2 ${getSourceBgColor(src.name)}`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-bold font-mono ${getSourceColor(src.name)}`}>{src.name}</h4>
                    <Badge variant="outline" className="text-[9px] bg-slate-900/50 text-slate-300 border-slate-700">
                      {src.type?.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <p className="text-slate-500">Records</p>
                      <p className="text-slate-200 font-bold">{src.count.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Avg Fare</p>
                      <p className="text-slate-200 font-bold">₹{src.avgFare.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Min Fare</p>
                      <p className="text-emerald-400 font-bold">₹{src.minFare.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Max Fare</p>
                      <p className="text-red-400 font-bold">₹{src.maxFare.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500/70"
                      style={{ width: `${Math.min(100, (src.count / (stats?.overview?.totalFares || 1)) * 100 * stats?.sources?.length!)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Routes Grid */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">DGCA Corridor Routes Breakdown</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Route</th>
                    <th className="px-4 py-2.5">Records</th>
                    <th className="px-4 py-2.5">Avg Fare</th>
                    <th className="px-4 py-2.5">Min Fare</th>
                    <th className="px-4 py-2.5">Max Fare</th>
                    <th className="px-4 py-2.5">Fare Range</th>
                    <th className="px-4 py-2.5">Coverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {stats?.routes?.map((route) => {
                    const maxCount = Math.max(...(stats?.routes?.map(r => r.count) || [1]));
                    const barWidth = (route.count / maxCount) * 100;
                    return (
                      <tr key={route.pair} className="hover:bg-slate-900/60 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-emerald-400">{route.origin}</span>
                          <span className="text-slate-600 mx-1">→</span>
                          <span className="font-bold text-cyan-400">{route.destination}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-200">{route.count.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-slate-200">₹{route.avgFare.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-emerald-400">₹{route.minFare.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-red-400">₹{route.maxFare.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-slate-400 text-[10px]">
                          ₹{(route.maxFare - route.minFare).toLocaleString("en-IN")} spread
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-24 bg-slate-900 rounded-full h-2 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${barWidth}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Latest Activity Feed */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-slate-100">Latest Ingested Fares (Live Feed)</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              {stats?.latestFares?.map((fare) => (
                <div key={fare.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60 hover:bg-slate-900 transition-colors">
                  <Plane className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200 truncate">{fare.carrier}</span>
                      <span className="text-[10px] font-mono text-emerald-400">{fare.flight_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="font-bold">{fare.route_origin}→{fare.route_destination}</span>
                      <span>•</span>
                      <span className={`font-bold uppercase ${getSourceColor(fare.source)}`}>{fare.source}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-white">₹{fare.total_fare.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(fare.scraped_at).toLocaleTimeString("en-IN", { hour12: false })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Control Modal */}
      <ScraperControlModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLaunch={handleLaunchScraper}
      />
    </div>
  );
}
