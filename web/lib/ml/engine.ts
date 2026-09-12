/**
 * Pure TypeScript Gradient Boosted Decision Tree Inference Engine
 * Evaluates the trained Champion v2 scikit-learn model natively in Node.js
 * in sub-millisecond execution time.
 */

import fs from "fs";
import path from "path";
import { MLFeatureEngineer } from "./feature-engineer";
import {
  FlightPredictionInput,
  FlightPredictionResult,
  HorizonPoint,
  ModelMetadata,
} from "./types";

let cachedModel: ModelMetadata | null = null;

function loadModel(): ModelMetadata {
  if (cachedModel) {
    return cachedModel;
  }

  const modelCandidates = ["v3_trees.json", "v2_trees.json"];
  const searchDirs = [
    path.join(process.cwd(), "artifacts", "models"),
    path.join(process.cwd(), "web", "artifacts", "models"),
  ];

  for (const filename of modelCandidates) {
    for (const dir of searchDirs) {
      const fullPath = path.join(dir, filename);
      if (fs.existsSync(fullPath)) {
        const raw = fs.readFileSync(fullPath, "utf-8");
        cachedModel = JSON.parse(raw) as ModelMetadata;
        return cachedModel;
      }
    }
  }

  throw new Error(`Model artifact not found in candidates [${modelCandidates.join(", ")}]`);
}

/**
 * Run native tree traversal on a 14-dimensional feature vector.
 */
export function predictVector(x: number[], model?: ModelMetadata): number {
  const m = model || loadModel();
  let pred = m.init_value;
  const lr = m.learning_rate;

  for (let i = 0; i < m.trees.length; i++) {
    const tree = m.trees[i];
    let node = 0;
    while (tree.children_left[node] !== -1) {
      const featIdx = tree.feature[node];
      const thresh = tree.threshold[node];
      if (x[featIdx] <= thresh) {
        node = tree.children_left[node];
      } else {
        node = tree.children_right[node];
      }
    }
    pred += lr * tree.value[node];
  }

  return Math.max(1000.0, Number(pred.toFixed(2)));
}

/**
 * Predict future airfare for a flight across time horizons with actionable recommendation.
 */
export function predictFlight(input: FlightPredictionInput): FlightPredictionResult {
  const model = loadModel();
  const now = new Date();
  const features = MLFeatureEngineer.extractFeatures(input, now);
  const vector = MLFeatureEngineer.toVector(features);

  // 24-Hour Horizon Prediction
  // Simulate 24 hours passing (1 day closer to departure)
  const features24h = {
    ...features,
    days_to_departure: Math.max(0, features.days_to_departure - 1.0),
  };
  const vector24h = MLFeatureEngineer.toVector(features24h);
  const predictedPrice = predictVector(vector24h, model);

  const priceDelta = Number((predictedPrice - input.currentPrice).toFixed(2));
  const percentChange = input.currentPrice > 0
    ? Number(((priceDelta / input.currentPrice) * 100).toFixed(2))
    : 0.0;

  // Horizon Progression Curve: Today, +1d, +3d, +7d, +14d, +21d, +30d
  const horizons = [
    { label: "Today (Current)", daysAhead: 0, daysLeft: features.days_to_departure },
    { label: "+24 Hours", daysAhead: 1, daysLeft: Math.max(0, features.days_to_departure - 1) },
    { label: "+3 Days", daysAhead: 3, daysLeft: Math.max(0, features.days_to_departure - 3) },
    { label: "+7 Days", daysAhead: 7, daysLeft: Math.max(0, features.days_to_departure - 7) },
    { label: "+14 Days", daysAhead: 14, daysLeft: Math.max(0, features.days_to_departure - 14) },
    { label: "+21 Days", daysAhead: 21, daysLeft: Math.max(0, features.days_to_departure - 21) },
    { label: "+30 Days", daysAhead: 30, daysLeft: Math.max(0, features.days_to_departure - 30) },
  ];

  const horizonCurve: HorizonPoint[] = horizons.map((h) => {
    if (h.daysAhead === 0) {
      return {
        horizonLabel: h.label,
        daysAhead: 0,
        predictedPrice: input.currentPrice,
        priceDelta: 0,
        percentChange: 0,
      };
    }
    const hFeatures = {
      ...features,
      days_to_departure: h.daysLeft,
    };
    const hVector = MLFeatureEngineer.toVector(hFeatures);
    const hPred = predictVector(hVector, model);
    const hDelta = Number((hPred - input.currentPrice).toFixed(2));
    const hPct = input.currentPrice > 0 ? Number(((hDelta / input.currentPrice) * 100).toFixed(2)) : 0;
    return {
      horizonLabel: h.label,
      daysAhead: h.daysAhead,
      predictedPrice: hPred,
      priceDelta: hDelta,
      percentChange: hPct,
    };
  });

  // Recommendation logic
  let recommendation: 'BUY_NOW' | 'WAIT_AND_MONITOR' | 'PRICE_STABLE';
  let recommendationReason: string;
  let potentialSavings = 0;

  if (percentChange >= 2.5) {
    recommendation = "BUY_NOW";
    recommendationReason = `Airfare is forecasted to surge by ₹${Math.abs(priceDelta)} (+${percentChange}%) over the next horizon as seat inventory tightens. Locking in now saves money.`;
    potentialSavings = Math.abs(priceDelta);
  } else if (percentChange <= -2.5) {
    recommendation = "WAIT_AND_MONITOR";
    recommendationReason = `Airfare is projected to soften or discount by ₹${Math.abs(priceDelta)} (${percentChange}%). Carrier load factors suggest holding off for flash sales or off-peak pricing.`;
    potentialSavings = Math.abs(priceDelta);
  } else {
    recommendation = "PRICE_STABLE";
    recommendationReason = `Airfare is exhibiting low volatility (within ±${Math.abs(percentChange)}%). Current pricing reflects corridor equilibrium.`;
    potentialSavings = 0;
  }

  // Confidence calculation based on corridor coverage and lead days
  let confidenceScore = 88;
  if (features.route_idx < 90) confidenceScore += 7; // Top tracked corridor
  if (features.days_to_departure <= 14) confidenceScore += 3; // High data density zone
  if (input.currentPrice > 25000) confidenceScore -= 8; // Outlier fare class
  confidenceScore = Math.min(98, Math.max(72, confidenceScore));

  return {
    currentPrice: input.currentPrice,
    predictedPrice,
    targetHorizonHours: 24,
    priceDelta,
    percentChange,
    recommendation,
    recommendationReason,
    confidenceScore,
    potentialSavings,
    horizonCurve,
    features,
    modelVersion: `${model.version || "v3"} (Production Champion)`,
    algorithm: "Gradient Boosting Regressor (100 Estimators)",
    evaluatedAt: now.toISOString(),
  };
}
