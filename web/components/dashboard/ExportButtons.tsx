"use client";

import { downloadAsCsv, downloadAsJson } from "@/lib/utils/export";

interface ExportButtonsProps {
  data: any[];
  filename: string;
}

export function ExportButtons({ data, filename }: ExportButtonsProps) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => downloadAsCsv(data, filename)}
        className="inline-flex items-center space-x-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition shadow-sm"
      >
        <span>📥 Export CSV</span>
      </button>
      <button
        onClick={() => downloadAsJson(data, filename)}
        className="inline-flex items-center space-x-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition shadow-sm"
      >
        <span>📄 Export JSON</span>
      </button>
    </div>
  );
}
