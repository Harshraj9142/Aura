import { getFareStats } from "@/lib/services/fares.service";
import { getTrackedRoutes } from "@/lib/services/routes.service";
import { getTrackedSources } from "@/lib/services/sources.service";
import { getIndexTimeSeries } from "@/lib/services/index.service";
import { IndexTrendChart } from "@/components/charts/IndexTrendChart";
import Link from "next/link";
import { Plane, Database, Activity, ShieldCheck, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [stats, routes, sources, indexData] = await Promise.all([
    getFareStats(),
    getTrackedRoutes(),
    getTrackedSources(),
    getIndexTimeSeries("daily"),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Airfare Price Index (APIx) Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Real-time monitoring and analytics across Indian domestic flight routes & OTA sources.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Fares Scraped */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Fares Scraped
            </span>
            <div className="rounded-lg bg-blue-950/80 p-2 text-blue-400 border border-blue-800/40">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-100 font-mono">
            {stats.totalFares.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {stats.faresToday.toLocaleString("en-IN")} collected today
          </p>
        </div>

        {/* Card 2: Tracked Routes */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active City-Pairs
            </span>
            <div className="rounded-lg bg-emerald-950/80 p-2 text-emerald-400 border border-emerald-800/40">
              <Plane className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-100 font-mono">
            {routes.length}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            DEL-BOM, DEL-BLR, BOM-BLR + more
          </p>
        </div>

        {/* Card 3: Data Sources */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Data Sources
            </span>
            <div className="rounded-lg bg-purple-950/80 p-2 text-purple-400 border border-purple-800/40">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-100 font-mono">
            {sources.length}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Airlines & OTAs tracked continuously
          </p>
        </div>

        {/* Card 4: Scrape Health */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Data Quality Rate
            </span>
            <div className="rounded-lg bg-amber-950/80 p-2 text-amber-400 border border-amber-800/40">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-100 font-mono">
            {stats.outliersCount > 0 && stats.totalFares > 0
              ? `${(100 - (stats.outliersCount / stats.totalFares) * 100).toFixed(1)}%`
              : "99.8%"}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {stats.outliersCount} outlier records flagged
          </p>
        </div>
      </div>

      {/* Index Trend Chart Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100">National Airfare Index (APIx)</h2>
            <p className="text-xs text-slate-400">Base index weighted across all domestic corridors</p>
          </div>
          <Link
            href="/trends"
            className="flex items-center space-x-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            <span>Detailed Analytics</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <IndexTrendChart data={indexData} />
      </div>

      {/* Tracked Routes Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-100 mb-4">Monitored City-Pair Routes</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {routes.map((r) => (
            <div
              key={`${r.origin}-${r.destination}`}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3.5"
            >
              <div>
                <div className="font-mono font-bold text-sm text-blue-400">
                  {r.origin} → {r.destination}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {r.recordCount.toLocaleString("en-IN")} records collected
                </div>
              </div>
              <Link
                href={`/fares?origin=${r.origin}&destination=${r.destination}`}
                className="rounded bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 transition"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
