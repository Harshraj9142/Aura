/**
 * APIx Web — TypeScript Type Definitions
 *
 * Shared interfaces for fare records, index values, routes, sources,
 * heatmap cells, elasticity points, and API response envelopes.
 */

// ─── Fare Record ─────────────────────────────────────────────────────────────

export interface Fare {
  id: string;
  route_origin: string;
  route_destination: string;
  travel_date: string; // ISO date string
  advance_purchase_days: number;
  source: string;
  source_type: "airline" | "ota";
  carrier: string | null;
  flight_number: string | null;
  fare_class: string | null;
  base_fare: number | null;
  taxes_and_fees: number | null;
  total_fare: number;
  currency: string;
  is_outlier: boolean;
  validation_warnings: any | null;
  scraped_at: string; // ISO datetime string
  created_at: string;
}

// ─── Route Info ──────────────────────────────────────────────────────────────

export interface RouteInfo {
  origin: string;
  destination: string;
  pair: string; // e.g. "DEL-BOM"
  firstSeen: string;
  lastSeen: string;
  recordCount: number;
}

// ─── Source Info ──────────────────────────────────────────────────────────────

export interface SourceInfo {
  source: string;
  sourceType: "airline" | "ota";
  recordCount: number;
}

// ─── Index Value ─────────────────────────────────────────────────────────────

export type IndexFrequency = "daily" | "weekly" | "monthly";

export interface IndexValue {
  id: string;
  date: string;
  origin?: string | null;
  destination?: string | null;
  frequency: IndexFrequency;
  index_value: number;
  pct_change?: number | null;
  created_at: string;
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

export interface HeatmapCell {
  route: string;
  travel_date: string;
  avg_total_fare: number;
}

// ─── Elasticity ──────────────────────────────────────────────────────────────

export interface ElasticityPoint {
  advance_purchase_days: number;
  avg_fare: number;
  min_fare: number;
  max_fare: number;
  sample_size: number;
}

// ─── API Response Envelope ───────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    fields?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Dashboard Overview ──────────────────────────────────────────────────────

export interface DashboardStats {
  totalFares: number;
  faresToday: number;
  outliersCount: number;
  latestScrapeRun: {
    startedAt: string;
    completedAt: string | null;
    status: string;
    totalSuccess: number;
    totalFailed: number;
  } | null;
}

// ─── Filter State ────────────────────────────────────────────────────────────

export interface FaresFilterState {
  origin?: string;
  destination?: string;
  source?: string;
  sourceType?: "airline" | "ota";
  dateFrom?: string;
  dateTo?: string;
  isOutlier?: boolean;
  page: number;
  limit: number;
  sortBy: "travel_date" | "total_fare" | "scraped_at";
  sortOrder: "asc" | "desc";
}
