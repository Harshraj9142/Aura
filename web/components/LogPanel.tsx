"use client";

import { useEffect, useRef, useState } from 'react';
import { ApiLogEntry } from '@/lib/api';
import { Terminal, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LogPanelProps {
  logs?: ApiLogEntry[];
}

export default function LogPanel({ logs: initialLogs = [] }: LogPanelProps) {
  const [liveLogs, setLiveLogs] = useState<ApiLogEntry[]>(initialLogs);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchLiveLogs = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/logs');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setLiveLogs(json.data);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch live logs:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveLogs();
    const interval = setInterval(fetchLiveLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveLogs]);

  return (
    <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-xl p-6 space-y-4 shadow-xl font-mono">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-xs">
            <Terminal className="w-4 h-4" />
          </div>
          <h3 className="text-slate-900 font-bold text-sm">Live Terminal Console Telemetry</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchLiveLogs}
            className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 transition-colors shadow-xs"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <Badge variant="secondary" className="text-xs font-mono bg-emerald-100 border-emerald-200 text-emerald-800 font-bold">
            ● LIVE STREAM ({liveLogs.length})
          </Badge>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-1.5 p-4 rounded-2xl font-mono text-xs bg-slate-950 text-slate-100 border border-slate-800 shadow-inner">
        {liveLogs.length === 0 ? (
          <p className="text-slate-500 text-center py-6">
            Awaiting Playwright scraper telemetry... Click "Run Scraper Now" above to stream live terminal logs!
          </p>
        ) : (
          liveLogs.map((log, index) => (
            <div
              key={log.id || `log-${index}`}
              className="flex items-start gap-2 py-1.5 px-3 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] font-mono leading-relaxed"
            >
              <span className="text-slate-500 shrink-0 tabular-nums font-sans text-[10px]">
                {log.timestamp?.slice(11, 19) || "00:00:00"}
              </span>
              <span className={`font-bold uppercase text-[10px] px-1.5 py-0.2 rounded shrink-0 ${
                log.method?.includes("ERROR") ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                log.method?.includes("WARN") ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {log.method || "INFO"}
              </span>
              <span className="text-slate-200 flex-1 break-all font-mono">
                {log.endpoint}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
