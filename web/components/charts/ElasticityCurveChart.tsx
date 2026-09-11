"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ElasticityPoint } from "@/types/fare";

interface ElasticityCurveChartProps {
  data: ElasticityPoint[];
}

export function ElasticityCurveChart({ data }: ElasticityCurveChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/50 text-slate-400">
        Select a route to view lead-time fare elasticity curve.
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    days: item.advance_purchase_days,
    label: `${item.advance_purchase_days}d prior`,
    avgFare: Number(item.avg_fare),
    minFare: Number(item.min_fare),
    maxFare: Number(item.max_fare),
    samples: item.sample_size,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis
            dataKey="days"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            unit=" days"
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#334155",
              borderRadius: "0.5rem",
              color: "#f8fafc",
            }}
            formatter={(value: any, name: any) => [
              `₹${Number(value || 0).toLocaleString("en-IN")}`,
              name === "avgFare" ? "Avg Fare" : name === "minFare" ? "Min Fare" : "Max Fare",
            ]}
            labelFormatter={(label) => `${label} Days Before Travel`}
          />
          <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px", color: "#94a3b8" }} />
          <Line
            type="monotone"
            dataKey="avgFare"
            name="Avg Fare"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ r: 4, fill: "#3b82f6" }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="minFare"
            name="Min Fare"
            stroke="#10b981"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="maxFare"
            name="Max Fare"
            stroke="#f43f5e"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
