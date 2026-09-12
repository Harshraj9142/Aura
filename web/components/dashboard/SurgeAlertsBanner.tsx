import { SurgeAlert } from "@/lib/services/alerts.service";

interface SurgeAlertsBannerProps {
  alerts: SurgeAlert[];
}

export function SurgeAlertsBanner({ alerts }: SurgeAlertsBannerProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <span>⚡ Live Anomaly & Surge Alerts</span>
          <span className="rounded-full bg-amber-950 px-2 py-0.5 text-[10px] text-amber-300 border border-amber-800">
            {alerts.length} Active
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-xl border p-4 shadow-sm transition ${
              alert.severity === "HIGH"
                ? "border-rose-800/60 bg-gradient-to-r from-rose-950/40 to-slate-950 text-rose-200"
                : "border-amber-800/60 bg-gradient-to-r from-amber-950/40 to-slate-950 text-amber-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono font-extrabold text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-white mr-2">
                  {alert.route}
                </span>
                <span className="text-xs font-bold">{alert.title}</span>
              </div>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                +{alert.surgePct}% Surge
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              {alert.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
