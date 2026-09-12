"use client";

import React, { useEffect, useRef, useState } from "react";
import { Terminal, Zap, RefreshCw, Trash2, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ScraperControlModal from "@/components/ScraperControlModal";

interface LogItem {
  id: string;
  time: string;
  level: "INFO" | "DEBUG" | "WARNING" | "ERROR" | "SUCCESS";
  text: string;
}

export default function LiveScraperTerminal() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const formatted: LogItem[] = json.data.map((item: any, i: number) => {
            let lvl: LogItem["level"] = "INFO";
            if (item.level?.includes("ERROR") || item.method?.includes("ERROR")) lvl = "ERROR";
            else if (item.level?.includes("WARN") || item.method?.includes("WARN")) lvl = "WARNING";
            else if (item.endpoint?.includes("✅") || item.endpoint?.includes("🎉") || item.endpoint?.includes("Extracted")) lvl = "SUCCESS";

            return {
              id: item.id || `log-${i}`,
              time: item.timestamp?.slice(11, 19) || new Date().toLocaleTimeString("en-IN", { hour12: false }),
              level: lvl,
              text: item.endpoint || item.message || JSON.stringify(item),
            };
          });
          setLogs(formatted);
        }
      }
    } catch (err) {
      console.warn("Log stream error:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleLaunchScraper = async (params: { source: string; route: string; window: string }) => {
    setIsScraping(true);
    try {
      const res = await fetch("/api/demo/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      fetchLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsScraping(false), 20000);
    }
  };

  const getLevelStyle = (level: LogItem["level"]) => {
    switch (level) {
      case "ERROR":
        return "text-red-400 font-semibold";
      case "WARNING":
        return "text-amber-400 font-semibold";
      case "SUCCESS":
        return "text-emerald-400 font-bold";
      case "DEBUG":
        return "text-slate-500 font-normal";
      default:
        return "text-cyan-300 font-normal";
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden font-mono">
      {/* Terminal Title Bar */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>harsh@HARSHs-MacBook-Air ~/Aura/scraper % python interactive_cli.py</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            disabled={isScraping}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-semibold h-7 gap-1.5"
          >
            {isScraping ? (
              <>
                <Zap className="w-3.5 h-3.5 animate-spin" />
                <span>Scraping Live Fares...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>⚡ Run Interactive Scraper</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchLogs}
            className="h-7 px-2 border-slate-800 text-slate-400 hover:text-slate-200"
            title="Refresh Logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setLogs([])}
            className="h-7 px-2 border-slate-800 text-slate-400 hover:text-red-400"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Terminal Screen Output */}
      <div className="p-4 bg-slate-950/95 max-h-96 overflow-y-auto space-y-1 text-[11px] leading-relaxed select-text font-mono">
        <div className="text-slate-500 border-b border-slate-900 pb-2 mb-2">
          <div className="text-emerald-400 font-bold">AIRFARE PRICE INDEX SYSTEM (APIx) — MoSPI / NSO Problem Statement #26056</div>
          <div className="text-slate-400">Playwright Multi-Source Engine connected to Neon PostgreSQL Database.</div>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center text-slate-600 space-y-2">
            <p>Awaiting live scraper telemetry...</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              className="text-xs border-slate-800 text-emerald-400 hover:bg-slate-900"
            >
              Click here to launch Interactive Scraper Probe
            </Button>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 hover:bg-slate-900/40 py-0.5 px-1 rounded transition-colors">
              <span className="text-slate-600 shrink-0 font-sans text-[10px] tabular-nums">{log.time}</span>
              <span className={`shrink-0 font-bold uppercase text-[9px] px-1 py-0.2 rounded ${
                log.level === "ERROR" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                log.level === "WARNING" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                log.level === "SUCCESS" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                "bg-slate-900 text-slate-400 border border-slate-800"
              }`}>
                {log.level}
              </span>
              <span className={`flex-1 break-all ${getLevelStyle(log.level)}`}>
                {log.text}
              </span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Footer Info Bar */}
      <div className="bg-slate-900/60 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>PostgreSQL DB Connection: Active</span>
        </div>
        <div className="font-mono">
          Logs auto-refreshing every 2.5s
        </div>
      </div>

      {/* Interactive Control Modal */}
      <ScraperControlModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLaunch={handleLaunchScraper}
      />
    </div>
  );
}
