import { getIndexTimeSeries } from "@/lib/services/index.service";
import { getTrackedRoutes } from "@/lib/services/routes.service";
import { IndexTrendChart } from "@/components/charts/IndexTrendChart";
import Link from "next/link";

interface TrendsPageProps {
  searchParams: Promise<{
    frequency?: string;
    origin?: string;
    destination?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function TrendsPage({ searchParams }: TrendsPageProps) {
  const params = await searchParams;
  const frequency = (params.frequency as "daily" | "weekly" | "monthly") || "daily";
  const origin = params.origin;
  const destination = params.destination;
  const dateFrom = params.dateFrom;
  const dateTo = params.dateTo;

  const [indexData, routes] = await Promise.all([
    getIndexTimeSeries(frequency, origin, destination, dateFrom, dateTo),
    getTrackedRoutes(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Airfare Price Index Trends
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Time-series analysis of domestic airfare indices across Indian corridors (Daily, Weekly, Monthly).
        </p>
      </div>

      {/* Control Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Frequency selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Aggregation:
            </span>
            <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800">
              {["daily", "weekly", "monthly"].map((f) => (
                <Link
                  key={f}
                  href={`/dashboard/trends?frequency=${f}${origin ? `&origin=${origin}` : ""}${destination ? `&destination=${destination}` : ""}`}
                  className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${
                    frequency === f
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f}
                </Link>
              ))}
            </div>
          </div>

          {/* Route selector links */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Corridor:
            </span>
            <Link
              href={`/dashboard/trends?frequency=${frequency}`}
              className={`rounded-md px-2.5 py-1 text-xs font-mono font-medium transition border ${
                !origin
                  ? "bg-slate-800 text-blue-400 border-blue-500/50"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
              }`}
            >
              All Routes
            </Link>
            {routes.map((r) => {
              const isSelected = origin === r.origin && destination === r.destination;
              return (
                <Link
                  key={`${r.origin}-${r.destination}`}
                  href={`/dashboard/trends?frequency=${frequency}&origin=${r.origin}&destination=${r.destination}`}
                  className={`rounded-md px-2.5 py-1 text-xs font-mono font-medium transition border ${
                    isSelected
                      ? "bg-slate-800 text-blue-400 border-blue-500/50"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {r.origin}-{r.destination}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-100">
            {origin && destination ? `${origin} → ${destination} Index` : "National Airfare Price Index"}
          </h2>
          <p className="text-xs text-slate-400">
            {frequency.charAt(0).toUpperCase() + frequency.slice(1)} weighted average price index values
          </p>
        </div>
        <IndexTrendChart data={indexData} />
      </div>
    </div>
  );
}
