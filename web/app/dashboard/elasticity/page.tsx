import { getElasticityData } from "@/lib/services/elasticity.service";
import { getTrackedRoutes } from "@/lib/services/routes.service";
import { ElasticityCurveChart } from "@/components/charts/ElasticityCurveChart";
import Link from "next/link";

interface ElasticityPageProps {
  searchParams: Promise<{
    origin?: string;
    destination?: string;
  }>;
}

export default async function ElasticityPage({ searchParams }: ElasticityPageProps) {
  const params = await searchParams;
  const routes = await getTrackedRoutes();

  // Default to first route if none specified
  const selectedOrigin = params.origin || (routes.length > 0 ? routes[0].origin : "DEL");
  const selectedDestination = params.destination || (routes.length > 0 ? routes[0].destination : "BOM");

  const elasticityData = await getElasticityData(selectedOrigin, selectedDestination);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-950">
          Lead-Time Fare Elasticity Curve
        </h1>
        <p className="mt-1 text-sm text-slate-600 font-medium">
          Analyze how ticket prices escalate as advance purchase booking window narrows prior to departure.
        </p>
      </div>

      {/* Corridor Selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 mr-2">
            Select Route Corridor:
          </span>
          {routes.map((r) => {
            const isSelected = selectedOrigin === r.origin && selectedDestination === r.destination;
            return (
              <Link
                key={`${r.origin}-${r.destination}`}
                href={`/dashboard/elasticity?origin=${r.origin}&destination=${r.destination}`}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono font-bold transition border ${
                  isSelected
                    ? "bg-blue-50 text-blue-900 border-blue-300 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {r.origin} → {r.destination}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Elasticity Chart Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-lg font-black text-slate-950 font-mono">
            {selectedOrigin} → {selectedDestination} Price Elasticity Curve
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Average, minimum, and maximum fares (INR) grouped by advance purchase booking days
          </p>
        </div>
        <ElasticityCurveChart data={elasticityData} />
      </div>
    </div>
  );
}
