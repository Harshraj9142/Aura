"use client";

import { useEffect, useRef } from 'react';
import { ApiLogEntry } from '@/lib/api';
import { Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LogPanelProps {
  logs: ApiLogEntry[];
}

function statusColor(code: number) {
  if (code >= 200 && code < 300) return 'text-emerald-400 font-semibold';
  if (code >= 400) return 'text-red-400 font-semibold';
  return 'text-amber-400 font-semibold';
}

function timeStr(timestamp: string) {
  try {
    return new Date(timestamp).toLocaleTimeString('en-IN', { hour12: false });
  } catch {
    return timestamp;
  }
}

export default function LogPanel({ logs }: LogPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <Terminal className="w-4 h-4 text-emerald-400" />
        <h3 className="text-slate-100 font-semibold text-sm">Live Telemetry & Logs</h3>
        <Badge variant="secondary" className="ml-auto text-xs font-mono bg-slate-900 border-slate-800 text-slate-300">
          {logs.length} events
        </Badge>
      </div>

      <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
        {logs.length === 0 ? (
          <p className="text-slate-500 text-center py-6">
            Awaiting telemetry... Run an analysis or trigger the scraper.
          </p>
        ) : (
          [...logs].reverse().map((log) => (
            <div
              key={log._id || log.id || Math.random().toString()}
              className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px]"
            >
              <span className="text-slate-400 tabular-nums">{timeStr(log.timestamp)}</span>
              <span className={`font-semibold ${log.method === 'POST' ? 'text-blue-400' : 'text-slate-400'}`}>
                {log.method}
              </span>
              <span className="text-slate-200 truncate flex-1">{log.endpoint}</span>
              <span className={statusColor(log.statusCode)}>{log.statusCode}</span>
              <span className="text-slate-400 tabular-nums">{log.responseTime || log.latencyMs || 0}ms</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
