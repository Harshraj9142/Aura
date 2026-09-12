"use client";

import { Fare, PaginationMeta } from "@/types/fare";
import AirlineLogo from "@/components/AirlineLogo";

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
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Route</th>
              <th className="p-3.5">Carrier / Flight</th>
              <th className="p-3.5">Source</th>
              <th className="p-3.5">Travel Date</th>
              <th className="p-3.5">Adv Days</th>
              <th className="p-3.5 text-right">Base Fare</th>
              <th className="p-3.5 text-right">Taxes & Fees</th>
              <th className="p-3.5 text-right">Total Fare</th>
              <th className="p-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-900">
            {fares.map((fare) => (
              <tr key={fare.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                  {fare.route_origin}-{fare.route_destination}
                </td>
                <td className="p-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <AirlineLogo airline={fare.carrier} flightNumber={fare.flight_number} size="sm" />
                    <div>
                      <div className="font-bold text-slate-900">{fare.carrier || "N/A"}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{fare.flight_number || "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3.5 whitespace-nowrap">
                  <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                    {fare.source}
                  </span>
                </td>
                <td className="p-3.5 whitespace-nowrap text-slate-800 font-medium">
                  {new Date(fare.travel_date).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="p-3.5 text-slate-800 font-mono font-bold">{fare.advance_purchase_days}d</td>
                <td className="p-3.5 text-right font-mono text-slate-600">
                  {fare.base_fare ? `₹${Number(fare.base_fare).toLocaleString("en-IN")}` : "—"}
                </td>
                <td className="p-3.5 text-right font-mono text-slate-600">
                  {fare.taxes_and_fees ? `₹${Number(fare.taxes_and_fees).toLocaleString("en-IN")}` : "—"}
                </td>
                <td className="p-3.5 text-right font-mono font-black text-emerald-700">
                  ₹{Number(fare.total_fare).toLocaleString("en-IN")}
                </td>
                <td className="p-3.5 text-center whitespace-nowrap">
                  {fare.is_outlier ? (
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                      Outlier
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
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
      <div className="flex items-center justify-between text-xs text-slate-600 px-1 font-medium">
        <div>
          Showing <span className="font-bold text-slate-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to{" "}
          <span className="font-bold text-slate-900">
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
          </span>{" "}
          of <span className="font-bold text-slate-900">{pagination.totalCount.toLocaleString()}</span> records
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange && onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs font-bold"
          >
            Previous
          </button>
          <span className="text-slate-800 font-bold">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange && onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs font-bold"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
