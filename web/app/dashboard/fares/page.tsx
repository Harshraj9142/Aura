import { getFares } from "@/lib/services/fares.service";
import { getTrackedRoutes } from "@/lib/services/routes.service";
import { getTrackedSources } from "@/lib/services/sources.service";
import { FaresFilterBar } from "@/components/fares/FaresFilterBar";
import { FaresTable } from "@/components/fares/FaresTable";
import { ExportButtons } from "@/components/dashboard/ExportButtons";

interface FaresPageProps {
  searchParams: Promise<{
    origin?: string;
    destination?: string;
    source?: string;
    dateFrom?: string;
    dateTo?: string;
    isOutlier?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function FaresPage({ searchParams }: FaresPageProps) {
  const params = await searchParams;

  const filters = {
    origin: params.origin,
    destination: params.destination,
    source: params.source,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    isOutlier: params.isOutlier === "true" ? true : params.isOutlier === "false" ? false : undefined,
    page: params.page ? parseInt(params.page, 10) : 1,
    limit: params.limit ? parseInt(params.limit, 10) : 25,
    sortBy: (params.sortBy as "travel_date" | "total_fare" | "scraped_at") || "scraped_at",
    sortOrder: (params.sortOrder as "asc" | "desc") || "desc",
  };

  const [faresResult, routes, sources] = await Promise.all([
    getFares(filters),
    getTrackedRoutes(),
    getTrackedSources(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">
            Raw Fare Explorer
          </h1>
          <p className="mt-1 text-sm text-slate-600 font-medium">
            Inspect, filter, and analyze granular scraped flight fare records across carriers and OTAs.
          </p>
        </div>
        <ExportButtons data={faresResult.data} filename="scraped_fares_data" />
      </div>

      {/* Filter Bar */}
      <FaresFilterBar routes={routes} sources={sources} />

      {/* Fares Table */}
      <FaresTable fares={faresResult.data} pagination={faresResult.pagination} />
    </div>
  );
}
