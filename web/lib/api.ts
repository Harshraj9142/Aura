export interface RouteInfo {
  code: string;
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  recordCount?: number;
}

export interface DailyFareData {
  date: string;
  averageFare: number;
  minimumFare: number;
  maximumFare: number;
  apixIndex: number;
  sampleCount?: number;
}

export interface FareAnalytics {
  todayAverage: number;
  sevenDayAverage: number;
  thirtyDayAverage: number;
  minimumFare: number;
  maximumFare: number;
  changeVs7Days: number;
  changeVs30Days: number;
  currentApixIndex: number;
  sevenDayApixIndex: number;
  thirtyDayApixIndex: number;
  totalObservations?: number;
}

export interface FareTrend {
  direction: 'INCREASING' | 'DECREASING' | 'STABLE';
  volatility: 'LOW' | 'MODERATE' | 'HIGH';
  note: string;
}

export interface DbFlightRecord {
  id: string;
  flightNumber: string;
  carrier: string;
  fareClass: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  travelDate: string;
  isOutlier: boolean;
  source: string;
}

export interface FareAnalyzeResult {
  route: string;
  airline: string;
  currentFare: number;
  currency: string;
  analytics: FareAnalytics;
  trend: FareTrend;
  historicalData: DailyFareData[];
  flights: DbFlightRecord[];
  dataSource: string;
  disclaimer: string;
}

export interface ApiLogEntry {
  _id: string;
  id?: string;
  timestamp: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  latencyMs?: number;
  message: string;
}

export interface ScraperResult {
  status: string;
  sourcesScanned: number;
  routesProcessed: number;
  recordsCollected: number;
  validRecords: number;
  recordsInserted: number;
  message: string;
}

const DEFAULT_AIRLINES = ['IndiGo', 'Air India', 'SpiceJet', 'Akasa Air', 'Air India Express'];

export const fetchRoutes = async (): Promise<RouteInfo[]> => {
  try {
    const res = await fetch('/api/routes');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data.map((r: any) => ({
          code: r.pair || `${r.origin}-${r.destination}`,
          origin: r.origin,
          destination: r.destination,
          originCity: r.originCity || r.origin,
          destinationCity: r.destinationCity || r.destination,
          recordCount: r.recordCount || 0,
        }));
      }
    }
  } catch (err) {
    console.warn('fetchRoutes error:', err);
  }
  return [];
};

export const fetchAirlines = async (): Promise<string[]> => {
  try {
    const res = await fetch('/api/airlines');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('fetchAirlines error:', err);
  }
  return DEFAULT_AIRLINES;
};

export const analyzeFare = async (
  origin: string,
  destination: string,
  airline: string
): Promise<FareAnalyzeResult | null> => {
  const res = await fetch('/api/fare/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination, airline }),
  });

  if (!res.ok) {
    throw new Error(`Analysis request failed: HTTP ${res.status}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Failed to query fare data from database');
  }

  return json.data; // May be null if database has no records for this query
};

export const fetchLogs = async (): Promise<ApiLogEntry[]> => {
  try {
    const res = await fetch('/api/logs');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('fetchLogs error:', err);
  }
  return [];
};

export const runScraper = async (): Promise<ScraperResult> => {
  const res = await fetch('/api/demo/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Scraper status check failed: HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data;
};
