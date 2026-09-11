"use client";

import { Fare, PaginationMeta } from "@/types/fare";

interface FaresTableProps {
  fares: Fare[];
  pagination: PaginationMeta;
  onPageChange?: (newPage: number) => void;
}

export function FaresTable({ fares, pagination, onPageChange }: FaresTableProps) {
  if (!fares || fares.length === 0) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center text-slate-400">
        <p className="text-sm font-medium">No fare records found matching your filter criteria.</p>
        <p className="mt-1 text-xs text-slate-500">Try adjusting your filters or search parameters.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3">Route</th>
              <th className="p-3">Carrier / Flight</th>
              <th className="p-3">Source</th>
              <th className="p-3">Travel Date</th>
              <th className="p-3">Adv Days</th>
              <th className="p-3 text-right">Base Fare</th>
              <th className="p-3 text-right">Taxes & Fees</th>
              <th className="p-3 text-right">Total Fare</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {fares.map((fare) => (
              <tr key={fare.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="p-3 font-mono font-bold text-blue-400 whitespace-nowrap">
                  {fare.route_origin}-{fare.route_destination}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <div className="font-medium">{fare.carrier || "N/A"}</div>
                  <div className="text-[11px] text-slate-400">{fare.flight_number || "—"}</div>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                    {fare.source}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap text-slate-300">
                  {new Date(fare.travel_date).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="p-3 text-slate-300 font-mono">{fare.advance_purchase_days}d</td>
                <td className="p-3 text-right font-mono text-slate-400">
                  {fare.base_fare ? `₹${Number(fare.base_fare).toLocaleString("en-IN")}` : "—"}
                </td>
                <td className="p-3 text-right font-mono text-slate-400">
                  {fare.taxes_and_fees ? `₹${Number(fare.taxes_and_fees).toLocaleString("en-IN")}` : "—"}
                </td>
                <td className="p-3 text-right font-mono font-bold text-emerald-400">
                  ₹{Number(fare.total_fare).toLocaleString("en-IN")}
                </td>
                <td className="p-3 text-center whitespace-nowrap">
                  {fare.is_outlier ? (
                    <span className="inline-flex items-center rounded-full bg-rose-950/80 px-2 py-0.5 text-[10px] font-semibold text-rose-300 border border-rose-800/60">
                      Outlier
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-950/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-800/60">
                      Valid
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Showing <span className="font-semibold text-slate-200">{((pagination.page - 1) * pagination.limit) + 1}</span> to{" "}
          <span className="font-semibold text-slate-200">
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
          </span>{" "}
          of <span className="font-semibold text-slate-200">{pagination.totalCount.toLocaleString()}</span> records
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange && onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          <span className="text-slate-300 font-medium">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange && onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
