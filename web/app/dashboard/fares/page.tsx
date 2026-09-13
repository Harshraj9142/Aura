import { getFares } from "@/lib/services/fares.service";
import { getTrackedRoutes } from "@/lib/services/routes.service";
import { getTrackedSources } from "@/lib/services/sources.service";
import { FaresExplorerClient } from "@/components/fares/FaresExplorerClient";

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
    <FaresExplorerClient
      fares={faresResult.data}
      pagination={faresResult.pagination}
      routes={routes}
      sources={sources}
    />
  );
}

