import { getHeatmapData } from "@/lib/services/heatmap.service";
import { HeatmapGrid } from "@/components/charts/HeatmapGrid";

interface HeatmapPageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function HeatmapPage({ searchParams }: HeatmapPageProps) {
  const params = await searchParams;
  const heatmapData = await getHeatmapData(params.dateFrom, params.dateTo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Route × Travel Date Fare Heatmap
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Visualize average airfares across all tracked routes and upcoming travel departure dates.
        </p>
      </div>

      {/* Heatmap Grid */}
      <HeatmapGrid data={heatmapData} />
    </div>
  );
}
