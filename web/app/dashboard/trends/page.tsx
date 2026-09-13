import { getIndexTimeSeries } from "@/lib/services/index.service";
import { getTrackedRoutes } from "@/lib/services/routes.service";
import { CorridorTrendsClient } from "@/components/trends/CorridorTrendsClient";

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
    <CorridorTrendsClient
      initialIndexData={indexData}
      routes={routes}
      frequency={frequency}
      origin={origin}
      destination={destination}
      dateFrom={dateFrom}
      dateTo={dateTo}
    />
  );
}

