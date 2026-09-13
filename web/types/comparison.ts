/**
 * APIx Web — Platform Comparison Type Definitions
 *
 * Types for comparing airfares across Airline direct platforms
 * and Online Travel Agencies (OTAs).
 */

export interface PlatformPriceEntry {
  source: string;
  sourceType: "airline" | "ota";
  totalFare: number;
  baseFare: number | null;
  taxesAndFees: number | null;
  currency: string;
  isBestPrice: boolean;
  differenceFromDirect?: number | null; // e.g. +250 or -180 vs direct airline booking
  percentFromDirect?: number | null;    // e.g. +4.5% or -3.2%
}

export interface FlightComparisonGroup {
  flightKey: string;
  routeOrigin: string;
  routeDestination: string;
  travelDate: string; // YYYY-MM-DD
  advancePurchaseDays: number;
  carrier: string;
  flightNumber: string;
  cleanFlightNumber: string;
  departureTime?: string | null;
  bestPrice: number;
  bestPlatform: string;
  bestSourceType: "airline" | "ota";
  maxPrice: number;
  spreadAmount: number;
  spreadPercent: number;
  hasAirlineDirect: boolean;
  directPrice: number | null;
  platforms: PlatformPriceEntry[];
}

export interface PlatformStat {
  source: string;
  sourceType: "airline" | "ota";
  appearances: number;
  bestPriceCount: number;
  winRate: number; // percentage e.g. 42.5
  avgFare: number;
  minFare: number;
  maxFare: number;
}

export interface ComparisonSummary {
  totalFlightsCompared: number;
  totalPlatformsTracked: number;
  avgSpreadAmount: number;
  avgSpreadPercent: number;
  maxSpreadFlight?: {
    route: string;
    carrier: string;
    flightNumber: string;
    spread: number;
  } | null;
  platformStats: PlatformStat[];
  carrierStats: {
    carrier: string;
    avgSpread: number;
    flightCount: number;
  }[];
}

export interface ComparisonDataResponse {
  summary: ComparisonSummary;
  flights: FlightComparisonGroup[];
  availableRoutes: { origin: string; destination: string; count: number }[];
  availableCarriers: string[];
  availableDates: string[];
}
