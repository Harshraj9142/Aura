/**
 * Types for Aura ML airfare price prediction engine.
 */

export interface FlightPredictionInput {
  origin: string;
  destination: string;
  airline: string;
  departureTime?: string; // ISO date or "YYYY-MM-DD"
  daysToDeparture?: number; // If departureTime is not passed
  currentPrice: number;
  stops?: number;
  durationMinutes?: number;
}

export interface FeatureDict {
  days_to_departure: number;
  hour_of_day: number;
  day_of_week: number;
  is_weekend: number;
  month: number;
  stops: number;
  duration_minutes: number;
  is_morning: number;
  is_evening: number;
  route_avg_price: number;
  price_ratio_to_route: number;
  airline_idx: number;
  route_idx: number;
  current_price: number;
}

export interface HorizonPoint {
  horizonLabel: string;
  daysAhead: number;
  predictedPrice: number;
  priceDelta: number;
  percentChange: number;
}

export interface FlightPredictionResult {
  currentPrice: number;
  predictedPrice: number;
  targetHorizonHours: number;
  priceDelta: number;
  percentChange: number;
  recommendation: 'BUY_NOW' | 'WAIT_AND_MONITOR' | 'PRICE_STABLE';
  recommendationReason: string;
  confidenceScore: number; // 0-100
  potentialSavings: number;
  horizonCurve: HorizonPoint[];
  features: FeatureDict;
  modelVersion: string;
  algorithm: string;
  evaluatedAt: string;
}

export interface ModelMetadata {
  algorithm: string;
  version: string;
  init_value: number;
  learning_rate: number;
  n_estimators: number;
  max_depth: number;
  feature_names: string[];
  trees: {
    children_left: number[];
    children_right: number[];
    feature: number[];
    threshold: number[];
    value: number[];
  }[];
}

export interface ModelPerformanceStats {
  championVersion: string;
  algorithm: string;
  mae: number;
  rmse: number;
  mape: number;
  trainingSamples: number;
  status: 'production' | 'candidate' | 'archived';
  lastRetrainedAt: string;
}

export interface LoggedPrediction {
  predictionId: string;
  flightSignature: string;
  predictedAt: string;
  targetHorizonHours: number;
  targetTime: string;
  predictedPrice: number;
  modelVersion: string;
  actualPrice?: number | null;
  error?: number | null;
  percentageError?: number | null;
  evaluatedAt?: string | null;
}
