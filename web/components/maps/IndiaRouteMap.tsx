"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";

export interface RouteLink {
  from: string;
  to: string;
  color?: string;
  strokeWidth?: number;
  highlight?: boolean;
}

export interface AirportNode {
  code: string;
  name: string;
  x: number; // ViewBox position X (0..320)
  y: number; // ViewBox position Y (0..360)
  isPrimary?: boolean;
}

// Accurate city airport node placements mapped onto /dashboard/1aa68819-6a93-448e-814b-174b8c437e9b.png
export const DEFAULT_AIRPORTS: Record<string, AirportNode> = {
  DEL: { code: "DEL", name: "New Delhi (IGI)", x: 145, y: 85, isPrimary: true },
  BOM: { code: "BOM", name: "Mumbai (CSMIA)", x: 80, y: 195, isPrimary: true },
  BLR: { code: "BLR", name: "Bengaluru (KIA)", x: 130, y: 275, isPrimary: true },
  HYD: { code: "HYD", name: "Hyderabad (RGIA)", x: 160, y: 215, isPrimary: true },
  CCU: { code: "CCU", name: "Kolkata (NSCBI)", x: 235, y: 150, isPrimary: true },
  MAA: { code: "MAA", name: "Chennai (MAA)", x: 155, y: 278, isPrimary: true },
  GOI: { code: "GOI", name: "Goa (Mopa/Dabolim)", x: 88, y: 232 },
  AMD: { code: "AMD", name: "Ahmedabad", x: 88, y: 162 },
  GAU: { code: "GAU", name: "Guwahati", x: 268, y: 122 },
};

export const DEFAULT_ROUTES: RouteLink[] = [
  { from: "BOM", to: "DEL", color: "#2563EB", strokeWidth: 2, highlight: true }, // Blue primary corridor
  { from: "DEL", to: "CCU", color: "#F43F5E", strokeWidth: 2, highlight: true }, // Red/Coral primary corridor
  { from: "BOM", to: "CCU", color: "#10B981", strokeWidth: 1.4 },
  { from: "BOM", to: "HYD", color: "#10B981", strokeWidth: 1.4 },
  { from: "BOM", to: "BLR", color: "#10B981", strokeWidth: 1.4 },
  { from: "DEL", to: "HYD", color: "#10B981", strokeWidth: 1.4 },
  { from: "DEL", to: "BLR", color: "#10B981", strokeWidth: 1.4 },
  { from: "BLR", to: "HYD", color: "#10B981", strokeWidth: 1.4 },
  { from: "HYD", to: "CCU", color: "#10B981", strokeWidth: 1.4 },
];

function calculateArcPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature = 0.18
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = (x1 + x2) / 2 - dy * curvature;
  const cy = (y1 + y2) / 2 + dx * curvature;
  return {
    d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`,
    midX: (x1 + 2 * cx + x2) / 4,
    midY: (y1 + 2 * cy + y2) / 4,
  };
}

interface IndiaRouteMapProps {
  width?: number;
  height?: number;
  routes?: RouteLink[];
  airports?: Record<string, AirportNode>;
  className?: string;
  onSelectCity?: (code: string) => void;
}

export function IndiaRouteMap({
  width = 320,
  height = 360,
  routes = DEFAULT_ROUTES,
  airports = DEFAULT_AIRPORTS,
  className = "",
  onSelectCity,
}: IndiaRouteMapProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  // Filter to show ONLY cities that are present in the active defined routes
  const activeCityCodes = useMemo(() => {
    const set = new Set<string>();
    routes.forEach((r) => {
      set.add(r.from);
      set.add(r.to);
    });
    return set;
  }, [routes]);

  const activeAirports = useMemo(() => {
    return Object.values(airports).filter((ap) => activeCityCodes.has(ap.code));
  }, [airports, activeCityCodes]);

  const projectedRoutes = useMemo(() => {
    return routes
      .map((r) => {
        const fromAp = airports[r.from];
        const toAp = airports[r.to];
        if (!fromAp || !toAp) return null;

        const arc = calculateArcPath(fromAp.x, fromAp.y, toAp.x, toAp.y);
        return {
          ...r,
          d: arc.d,
          midX: arc.midX,
          midY: arc.midY,
        };
      })
      .filter(Boolean);
  }, [routes, airports]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
      {/* 1. HIGH-RESOLUTION OFFICIAL INDIA MAP IMAGE LAYER */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        <Image
          src="/dashboard/1aa68819-6a93-448e-814b-174b8c437e9b.png"
          alt="Map of India"
          fill
          sizes="(max-width: 768px) 100vw, 360px"
          className="object-contain opacity-85 drop-shadow-sm pointer-events-none"
          priority
        />
      </div>

      {/* 2. OVERLAY SVG LAYER FOR FLIGHT ARCS & CITY NODES */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="relative z-10 w-full h-full object-contain overflow-visible"
      >
        <defs>
          {/* Glowing Radial Gradient for Active Airport Nodes */}
          <radialGradient id="node-pulse-blue" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* FLIGHT ROUTE ARCS */}
        <g className="route-arcs">
          {projectedRoutes.map((route, i) =>
            route ? (
              <g key={`route-${route.from}-${route.to}-${i}`}>
                {/* Arc Shadow / Outer Glow */}
                <path
                  d={route.d}
                  fill="none"
                  stroke={route.color || "#10B981"}
                  strokeWidth={(route.strokeWidth || 1.4) + 1.8}
                  strokeOpacity="0.25"
                  strokeLinecap="round"
                />
                {/* Main Flight Line Arc */}
                <path
                  d={route.d}
                  fill="none"
                  stroke={route.color || "#10B981"}
                  strokeWidth={route.strokeWidth || 1.4}
                  strokeOpacity={route.highlight ? 0.95 : 0.85}
                  strokeLinecap="round"
                />
              </g>
            ) : null
          )}
        </g>

        {/* WAYPOINT INTERSECTION PULSE DOTS */}
        <g className="waypoints">
          {projectedRoutes.map((route, i) =>
            route ? (
              <circle
                key={`wp-${i}`}
                cx={route.midX}
                cy={route.midY}
                r={i % 3 === 0 ? 2.5 : 1.8}
                fill={route.color === "#F43F5E" ? "#EF4444" : "#10B981"}
                className="animate-pulse"
              />
            ) : null
          )}
        </g>

        {/* CITY AIRPORT NODES & LABELS (ONLY FOR DEFINED ROUTES) */}
        <g className="airport-nodes">
          {activeAirports.map((ap) => {
            const isHovered = hoveredCity === ap.code;
            return (
              <g
                key={`ap-${ap.code}`}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredCity(ap.code)}
                onMouseLeave={() => setHoveredCity(null)}
                onClick={() => onSelectCity?.(ap.code)}
              >
                {/* Outer Glow Ring */}
                <circle
                  cx={ap.x}
                  cy={ap.y}
                  r={isHovered ? 14 : 9}
                  fill="url(#node-pulse-blue)"
                  className="transition-all duration-300 opacity-80 group-hover:opacity-100"
                />

                {/* Center Node Dot */}
                <circle
                  cx={ap.x}
                  cy={ap.y}
                  r={ap.isPrimary ? 4.8 : 3.8}
                  fill="#0F172A"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="transition-transform duration-200 group-hover:scale-125 drop-shadow-xs"
                />

                {/* City Code Label */}
                <text
                  x={ap.x + (ap.code === "BOM" ? -30 : ap.code === "BLR" ? 10 : 9)}
                  y={ap.y + (ap.code === "BLR" ? 13 : ap.code === "BOM" ? 4 : 3)}
                  fontSize="11"
                  fontWeight="800"
                  fill="#0F172A"
                  className="select-none font-mono drop-shadow-sm"
                >
                  {ap.code}
                </text>

                {/* Hover Tooltip */}
                {isHovered && (
                  <g transform={`translate(${ap.x - 45}, ${ap.y - 34})`}>
                    <rect
                      x="0"
                      y="0"
                      width="90"
                      height="24"
                      rx="6"
                      fill="#0F172A"
                      opacity="0.95"
                      className="shadow-xl"
                    />
                    <text
                      x="45"
                      y="16"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {ap.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
