"use client";

import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { DailyFareData } from '@/lib/api';

interface FareChartProps {
  data: DailyFareData[];
  thirtyDayAvg: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

const CustomTooltip = ({ active, payload, label, mode }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-1.5 shadow-xl">
      <p className="text-slate-200 font-semibold mb-2">{formatDate(label)}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex justify-between gap-4 font-mono">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="text-slate-100 font-medium">
            {mode === 'index' ? entry.value : formatINR(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function FareChart({ data, thirtyDayAvg }: FareChartProps) {
  const [mode, setMode] = useState<'fare' | 'index'>('fare');

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-slate-100 font-semibold text-sm">30-Day Fare & Index Trend</h3>
          <p className="text-slate-400 text-xs mt-0.5">Historical daily observation points</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setMode('fare')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'fare' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Absolute Fare (₹)
            </button>
            <button
              onClick={() => setMode('index')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'index' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              APIx Index
            </button>
          </div>
          {mode === 'fare' && (
            <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 hidden sm:block">
              Baseline 30D Avg: <span className="font-semibold text-slate-200 font-mono">{formatINR(thirtyDayAvg)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="maxGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="minGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={mode === 'fare' ? (v) => `₹${(v / 1000).toFixed(1)}k` : (v) => `${v}`}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              width={55}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip mode={mode} />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
            
            {mode === 'fare' && (
              <ReferenceLine
                y={thirtyDayAvg}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{ value: '30D Baseline', fill: '#94a3b8', fontSize: 10, position: 'insideTopRight' }}
              />
            )}
            {mode === 'fare' && <Area type="monotone" dataKey="maximumFare" name="Max Fare" stroke="#ef4444" strokeWidth={1.5} fill="url(#maxGrad)" dot={false} />}
            {mode === 'fare' && <Area type="monotone" dataKey="averageFare" name="Avg Fare" stroke="#10b981" strokeWidth={2} fill="url(#avgGrad)" dot={false} />}
            {mode === 'fare' && <Area type="monotone" dataKey="minimumFare" name="Min Fare" stroke="#3b82f6" strokeWidth={1.5} fill="url(#minGrad)" dot={false} />}
            
            {mode === 'index' && (
              <ReferenceLine
                y={100}
                stroke="#64748b"
                strokeDasharray="4 4"
                label={{ value: 'Base 100', fill: '#94a3b8', fontSize: 10, position: 'insideTopRight' }}
              />
            )}
            {mode === 'index' && <Area type="monotone" dataKey="apixIndex" name="APIx Index" stroke="#10b981" strokeWidth={2} fillOpacity={0.2} fill="#10b981" dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
