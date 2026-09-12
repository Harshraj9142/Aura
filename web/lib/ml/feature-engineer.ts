/**
 * Feature Engineer for Aura ML — TypeScript Port
 * Matches feature extraction logic from aura_ml.features.engineer.FeatureEngineer
 */

import { FeatureDict, FlightPredictionInput } from "./types";

export const AIRLINES_LIST = [
  "IndiGo",
  "Air India",
  "Vistara",
  "SpiceJet",
  "Akasa Air",
  "AirAsia India",
];

export const ROUTES_TOP = [
  "DEL_BOM", "BOM_DEL",
  "CCU_DEL", "DEL_CCU",
  "BLR_DEL", "DEL_BLR",
  "BOM_BLR", "BLR_BOM",
  "HYD_DEL", "DEL_HYD",
  "MAA_DEL", "DEL_MAA",
];

export const ROUTE_BENCHMARKS: Record<string, number> = {
  "DEL_BOM": 5500.0,
  "BOM_DEL": 5500.0,
  "CCU_DEL": 5100.0,
  "DEL_CCU": 5100.0,
  "BLR_DEL": 6200.0,
  "DEL_BLR": 6200.0,
  "BOM_BLR": 4200.0,
  "BLR_BOM": 4200.0,
  "HYD_DEL": 4800.0,
  "DEL_HYD": 4800.0,
  "MAA_DEL": 5600.0,
  "DEL_MAA": 5600.0,
};

export class MLFeatureEngineer {
  static getRouteAvgPrice(origin: string, dest: string): number {
    const key = `${origin.toUpperCase()}_${dest.toUpperCase()}`;
    return ROUTE_BENCHMARKS[key] || 5000.0;
  }

  static extractFeatures(input: FlightPredictionInput, referenceNow: Date = new Date()): FeatureDict {
    let depDate: Date;
    let daysToDep: number;

    if (input.departureTime) {
      depDate = new Date(input.departureTime);
      if (isNaN(depDate.getTime())) {
        depDate = new Date(referenceNow.getTime() + (input.daysToDeparture || 7) * 86400000);
      }
      const deltaMs = depDate.getTime() - referenceNow.getTime();
      daysToDep = Math.max(0, deltaMs / 86400000);
    } else {
      daysToDep = Math.max(0, input.daysToDeparture ?? 7);
      depDate = new Date(referenceNow.getTime() + daysToDep * 86400000);
    }

    const hour = depDate.getUTCHours();
    const dayOfWeek = (depDate.getUTCDay() + 6) % 7; // Convert JS 0=Sun..6=Sat to Python 0=Mon..6=Sun
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 ? 1.0 : 0.0;
    const month = depDate.getUTCMonth() + 1; // 1-12
    const stops = Number(input.stops ?? 0);
    const durationMinutes = Number(input.durationMinutes ?? 130);
    const currentPrice = Number(input.currentPrice ?? 5000.0);

    const isMorning = hour >= 6 && hour <= 10 ? 1.0 : 0.0;
    const isEvening = hour >= 17 && hour <= 21 ? 1.0 : 0.0;

    // Airline index
    const airlineNormalized = input.airline.trim();
    const airlineMatchIndex = AIRLINES_LIST.findIndex(
      (a) => a.toLowerCase() === airlineNormalized.toLowerCase()
    );
    const airlineIdx = airlineMatchIndex >= 0 ? Number(airlineMatchIndex) : 0.0;

    // Route index
    const routeKey = `${input.origin.toUpperCase()}_${input.destination.toUpperCase()}`;
    const routeMatchIndex = ROUTES_TOP.indexOf(routeKey);
    const routeIdx = routeMatchIndex >= 0 ? Number(routeMatchIndex) : 99.0;

    const routeAvg = this.getRouteAvgPrice(input.origin, input.destination);
    const priceRatio = routeAvg > 0 ? currentPrice / routeAvg : 1.0;

    return {
      days_to_departure: Number(daysToDep.toFixed(2)),
      hour_of_day: hour,
      day_of_week: dayOfWeek,
      is_weekend: isWeekend,
      month,
      stops,
      duration_minutes: durationMinutes,
      is_morning: isMorning,
      is_evening: isEvening,
      route_avg_price: routeAvg,
      price_ratio_to_route: Number(priceRatio.toFixed(4)),
      airline_idx: airlineIdx,
      route_idx: routeIdx,
      current_price: currentPrice,
    };
  }

  static toVector(features: FeatureDict): number[] {
    return [
      features.days_to_departure,
      features.hour_of_day,
      features.day_of_week,
      features.is_weekend,
      features.month,
      features.stops,
      features.duration_minutes,
      features.is_morning,
      features.is_evening,
      features.route_avg_price,
      features.price_ratio_to_route,
      features.airline_idx,
      features.route_idx,
      features.current_price,
    ];
  }
}
