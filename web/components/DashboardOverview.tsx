"use client";

import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import { TrendingUp, Activity, Globe, Database, Terminal, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DbStats {
  totalFares: number;
  faresToday: number;
  outliersCount: number;
  routesCount: number;
  sourcesCount: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DbStats>({
    totalFares: 0,
    faresToday: 0,
    outliersCount: 0,
    routesCount: 0,
    sourcesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [routesRes, sourcesRes, faresRes] = await Promise.all([
          fetch('/api/routes').then((r) => r.json()).catch(() => ({ data: [] })),
          fetch('/api/sources').then((r) => r.json()).catch(() => ({ data: [] })),
          fetch('/api/fares?limit=1').then((r) => r.json()).catch(() => ({ meta: { totalCount: 0 } })),
        ]);

        const totalFares = faresRes?.meta?.totalCount || 0;
        const routesCount = Array.isArray(routesRes?.data) ? routesRes.data.length : 0;
        const sourcesCount = Array.isArray(sourcesRes?.data) ? sourcesRes.data.length : 0;

        setStats({
          totalFares,
          faresToday: 0,
          outliersCount: 0,
          routesCount,
          sourcesCount,
        });
      } catch (err) {
        console.warn("Failed to load DB stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="h-64 rounded-xl border border-slate-800 bg-slate-950 p-6 flex flex-col items-center justify-center space-y-3">
        <Activity className="w-6 h-6 animate-spin text-emerald-400" />
        <p className="text-xs text-slate-400 font-mono">Querying database state…</p>
      </div>
    );
  }

  // Strict Database Mode: If database has 0 fare records
  if (stats.totalFares === 0 && stats.routesCount === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center space-y-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
          <Database className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-lg font-bold text-slate-100">Strict Database Mode Active</h3>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
              Live DB
            </Badge>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            No scraped records found in the database. Synthetic fallbacks and mock charts are disabled.
          </p>
        </div>

        {/* Action card showing command to run */}
        <div className="max-w-xl mx-auto rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>To populate data, run the scraper CLI:</span>
          </div>
          <div className="bg-black/80 rounded border border-slate-800/80 p-3 font-mono text-xs text-emerald-400 select-all overflow-x-auto">
            python main.py --run-now
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Or scrape a single route: <code className="text-slate-300">python main.py --run-now --route DEL-BOM --source indigo</code>
          </p>
        </div>

        {/* Database Zero KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 max-w-2xl mx-auto">
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-4">
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Fares in Database</p>
            <p className="text-2xl font-bold font-mono text-slate-200 mt-1">0</p>
          </div>
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-4">
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Tracked City-Pairs</p>
            <p className="text-2xl font-bold font-mono text-slate-200 mt-1">0</p>
          </div>
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-4">
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Outliers Flagged</p>
            <p className="text-2xl font-bold font-mono text-slate-200 mt-1">0</p>
          </div>
        </div>
      </div>
    );
  }

  // Database HAS records: Render real stats
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">National Aviation Overview</h2>
          <p className="text-sm text-slate-400 mt-0.5">Strict live data from PostgreSQL database.</p>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
          Strict Database Mode
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
          <p className="text-xs text-slate-400">Total Fares Scraped</p>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{stats.totalFares.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
          <p className="text-xs text-slate-400">Active Monitored Routes</p>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{stats.routesCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
          <p className="text-xs text-slate-400">Active Data Sources</p>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{stats.sourcesCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
          <p className="text-xs text-slate-400">Outlier Records</p>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{stats.outliersCount}</p>
        </div>
      </div>
    </div>
  );
}
