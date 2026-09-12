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
      <div className="h-64 rounded-xl border border-slate-200 bg-white p-6 flex flex-col items-center justify-center space-y-3 shadow-xs">
        <Activity className="w-6 h-6 animate-spin text-emerald-600" />
        <p className="text-xs text-slate-600 font-mono font-medium">Querying database state…</p>
      </div>
    );
  }

  // Strict Database Mode: If database has 0 fare records
  if (stats.totalFares === 0 && stats.routesCount === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-6 shadow-xs">
        <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
          <Database className="w-6 h-6 text-emerald-600" />
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-lg font-black text-slate-950">Strict Database Mode Active</h3>
            <Badge variant="outline" className="bg-emerald-100 text-emerald-900 border-emerald-200 text-[10px] font-bold">
              Live DB
            </Badge>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            No scraped records found in the database. Synthetic fallbacks and mock charts are disabled.
          </p>
        </div>

        {/* Action card showing command to run */}
        <div className="max-w-xl mx-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-700 font-bold uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-emerald-600" />
            <span>To populate data, run the scraper CLI:</span>
          </div>
          <div className="bg-slate-900 rounded border border-slate-800 p-3 font-mono text-xs text-emerald-400 select-all overflow-x-auto font-bold">
            python main.py --run-now
          </div>
          <p className="text-[11px] text-slate-600 font-mono">
            Or scrape a single route: <code className="text-slate-900 font-bold">python main.py --run-now --route DEL-BOM --source indigo</code>
          </p>
        </div>

        {/* Database Zero KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 max-w-2xl mx-auto">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] text-slate-600 uppercase font-mono font-bold tracking-wider">Fares in Database</p>
            <p className="text-2xl font-black font-mono text-slate-950 mt-1">0</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] text-slate-600 uppercase font-mono font-bold tracking-wider">Tracked City-Pairs</p>
            <p className="text-2xl font-black font-mono text-slate-950 mt-1">0</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] text-slate-600 uppercase font-mono font-bold tracking-wider">Outliers Flagged</p>
            <p className="text-2xl font-black font-mono text-slate-950 mt-1">0</p>
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
          <h2 className="text-xl font-black tracking-tight text-slate-950">National Aviation Overview</h2>
          <p className="text-sm text-slate-600 font-medium mt-0.5">Strict live data from PostgreSQL database.</p>
        </div>
        <Badge variant="outline" className="bg-emerald-100 text-emerald-900 border-emerald-200 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-600 mr-2" />
          Strict Database Mode
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs text-slate-600 font-bold">Total Fares Scraped</p>
          <p className="text-2xl font-black font-mono text-slate-950 mt-2">{stats.totalFares.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs text-slate-600 font-bold">Active Monitored Routes</p>
          <p className="text-2xl font-black font-mono text-slate-950 mt-2">{stats.routesCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs text-slate-600 font-bold">Active Data Sources</p>
          <p className="text-2xl font-black font-mono text-slate-950 mt-2">{stats.sourcesCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs text-slate-600 font-bold">Outlier Records</p>
          <p className="text-2xl font-black font-mono text-slate-950 mt-2">{stats.outliersCount}</p>
        </div>
      </div>
    </div>
  );
}
