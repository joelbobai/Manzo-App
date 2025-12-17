import type { Airport } from "@/types/flight";

type AirportLookup = Map<string, string | null>;

type LookupCache = WeakMap<Airport[], AirportLookup>;

const countryLookupCache: LookupCache = new WeakMap();
const locationLookupCache: LookupCache = new WeakMap();

function buildLookup(
  data: Airport[],
  extractor: (airport: Airport) => string | null
): AirportLookup {
  const lookup: AirportLookup = new Map();

  data.forEach((airport) => {
    const code = airport.IATA?.toUpperCase();

    if (!code || lookup.has(code)) {
      return;
    }

    lookup.set(code, extractor(airport));
  });

  return lookup;
}

function extractAirportLabel(airport: Airport): string | null {
  const location = airport.Location_served;

  if (location) {
    const parts = location
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }

    if (parts.length > 0) {
      return parts[0];
    }
  }

  return airport.Airport_name ?? airport.IATA ?? null;
}

function extractLocationLabel(airport: Airport): string | null {
  const location = airport.Location_served;

  if (location) {
    return location.replace(/\u00a0/g, " ").trim() || null;
  }

  return airport.Airport_name ?? airport.IATA ?? null;
}

function getLookup(
  data: Airport[],
  cache: LookupCache,
  extractor: (airport: Airport) => string | null
): AirportLookup {
  const cached = cache.get(data);

  if (cached) {
    return cached;
  }

  const lookup = buildLookup(data, extractor);
  cache.set(data, lookup);
  return lookup;
}

export function getCountryByIATA(
  data: Airport[],
  iataCode?: string | null
): string | null {
  if (!iataCode || data.length === 0) return null;

  const normalizedCode = iataCode.toUpperCase();
  const lookup = getLookup(data, countryLookupCache, extractAirportLabel);

  if (lookup.has(normalizedCode)) {
    return lookup.get(normalizedCode) ?? null;
  }

  const airport = data.find(
    (a) => a.IATA?.toUpperCase() === normalizedCode
  );

  const label = airport ? extractAirportLabel(airport) : null;
  lookup.set(normalizedCode, label);

  return label;
}

export function getAirportLocation(
  data: Airport[],
  iataCode?: string | null
): string | null {
  if (!iataCode || data.length === 0) return null;

  const normalizedCode = iataCode.toUpperCase();
  const lookup = getLookup(data, locationLookupCache, extractLocationLabel);

  if (lookup.has(normalizedCode)) {
    return lookup.get(normalizedCode) ?? null;
  }

  const airport = data.find(
    (a) => a.IATA?.toUpperCase() === normalizedCode
  );

  const label = airport ? extractLocationLabel(airport) : null;
  lookup.set(normalizedCode, label);

  return label;
}
