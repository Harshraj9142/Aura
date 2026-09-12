import { getIndexTimeSeries } from "@/lib/services/index.service";
import { getTrackedRoutes } from "@/lib/services/routes.service";
import { IndexTrendChart } from "@/components/charts/IndexTrendChart";
import { ExportButtons } from "@/components/dashboard/ExportButtons";
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">
            Airfare Price Index Trends
          </h1>
          <p className="mt-1 text-sm text-slate-600 font-medium">
            Time-series analysis of domestic airfare indices across Indian corridors (Daily, Weekly, Monthly).
          </p>
        </div>
        <ExportButtons data={indexData} filename={`apix_index_${frequency}`} />
      </div>

      {/* Control Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Frequency selector */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Frequency:
              </span>
              <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                {[
                  { label: "1 Day (Daily)", value: "daily" },
                  { label: "7 Days (Weekly)", value: "weekly" },
                  { label: "30 Days (Monthly)", value: "monthly" },
                ].map((f) => (
                  <Link
                    key={f.value}
                    href={`/dashboard/trends?frequency=${f.value}${origin ? `&origin=${origin}` : ""}${destination ? `&destination=${destination}` : ""}`}
                    className={`rounded-md px-3 py-1 text-xs font-bold capitalize transition ${
                      frequency === f.value
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    {f.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Time Horizon Quick Filters (1 Day, 7 Days, 30 Days) */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Range:
              </span>
              <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                {[
                  { label: "1 Day", days: 1 },
                  { label: "7 Days", days: 7 },
                  { label: "30 Days", days: 30 },
                  { label: "All Time", days: 0 },
                ].map((range) => {
                  const today = new Date("2026-09-11");
                  let fromStr = "";
                  if (range.days > 0) {
                    const fromDate = new Date(today.getTime() - (range.days - 1) * 24 * 60 * 60 * 1000);
                    fromStr = fromDate.toISOString().split("T")[0];
                  }
                  const isSelected = dateFrom === fromStr || (range.days === 0 && !dateFrom);
                  const href = `/dashboard/trends?frequency=${frequency}${origin ? `&origin=${origin}` : ""}${destination ? `&destination=${destination}` : ""}${fromStr ? `&dateFrom=${fromStr}&dateTo=2026-09-11` : ""}`;

                  return (
                    <Link
                      key={range.label}
                      href={href}
                      className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                        isSelected
                          ? "bg-white text-emerald-800 font-black border border-emerald-300 shadow-xs"
                          : "text-slate-700 hover:text-slate-950"
                      }`}
                    >
                      {range.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Route selector links */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Corridor:
            </span>
            <Link
              href={`/dashboard/trends?frequency=${frequency}`}
              className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition border ${
                !origin
                  ? "bg-blue-50 text-blue-800 border-blue-300"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
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
                  className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition border ${
                    isSelected
                      ? "bg-blue-50 text-blue-800 border-blue-300"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
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
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-lg font-black text-slate-950">
            {origin && destination ? `${origin} → ${destination} Index` : "National Airfare Price Index"}
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            {frequency.charAt(0).toUpperCase() + frequency.slice(1)} weighted average price index values
          </p>
        </div>
        <IndexTrendChart data={indexData} />
      </div>
    </div>
  );
}
