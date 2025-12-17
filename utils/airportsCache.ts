import type { Airport } from "@/types/flight";

const AIRPORTS_ENDPOINT = "@/data/IATA_airports.json";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour, refresh occasionally

let cachedAirports: { data: Airport[]; expiresAt: number } | null = null;
let inFlightRequest: Promise<Airport[]> | null = null;

function isCacheValid(entry: typeof cachedAirports): entry is {
  data: Airport[];
  expiresAt: number;
} {
  return Boolean(entry && entry.expiresAt > Date.now());
}

export function getCachedAirports(): Airport[] | null {
  if (isCacheValid(cachedAirports)) {
    return cachedAirports.data;
  }

  cachedAirports = null;
  return null;
}

export async function loadAirports(signal?: AbortSignal): Promise<Airport[]> {
  const cached = getCachedAirports();
  if (cached) {
    return cached;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = fetch(AIRPORTS_ENDPOINT, { signal })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to load airport reference data (status ${response.status}).`
        );
      }

      return (await response.json()) as Airport[];
    })
    .then((data) => {
      cachedAirports = {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
      return data;
    })
    .finally(() => {
      inFlightRequest = null;
    });

  inFlightRequest = request;
  return request;
}

export function primeAirportsCache(data: Airport[]): void {
  cachedAirports = {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
}

export function clearAirportsCache(): void {
  cachedAirports = null;
  inFlightRequest = null;
}
