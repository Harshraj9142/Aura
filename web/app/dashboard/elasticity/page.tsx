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
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Lead-Time Fare Elasticity Curve
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Analyze how ticket prices escalate as advance purchase booking window narrows prior to departure.
        </p>
      </div>

      {/* Corridor Selector */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">
            Select Route Corridor:
          </span>
          {routes.map((r) => {
            const isSelected = selectedOrigin === r.origin && selectedDestination === r.destination;
            return (
              <Link
                key={`${r.origin}-${r.destination}`}
                href={`/dashboard/elasticity?origin=${r.origin}&destination=${r.destination}`}
                className={`rounded-md px-3 py-1.5 text-xs font-mono font-bold transition border ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                }`}
              >
                {r.origin} → {r.destination}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Elasticity Chart Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-100 font-mono">
            {selectedOrigin} → {selectedDestination} Price Elasticity Curve
          </h2>
          <p className="text-xs text-slate-400">
            Average, minimum, and maximum fares (INR) grouped by advance purchase booking days
          </p>
        </div>
        <ElasticityCurveChart data={elasticityData} />
      </div>
    </div>
  );
}
