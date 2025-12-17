"use client";

import type { Airport } from "@/types/flight";
import {
    getCachedAirports,
    loadAirports,
    primeAirportsCache,
} from "@/utils/airportsCache";
import { useEffect, useMemo, useState } from "react";

interface UseAirportsState {
  airports: Airport[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown error while loading airports");
}

export function useAirports(): UseAirportsState {
  const initialAirports = useMemo(() => getCachedAirports() ?? [], []);
  const [airports, setAirports] = useState<Airport[]>(initialAirports);
  const [loading, setLoading] = useState<boolean>(initialAirports.length === 0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (initialAirports.length > 0) {
      return;
    }

    let active = true;

    const fetchAirports = async () => {
      setLoading(true);

      try {
        const data = await loadAirports();
        if (!active) return;
        setAirports(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        const normalized = normalizeError(err);
        setError(normalized);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchAirports();

    return () => {
      active = false;
    };
    // We intentionally only run on mount; cache updates trigger reload manually.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await loadAirports();
      primeAirportsCache(data);
      setAirports(data);
    } catch (err) {
      const normalized = normalizeError(err);
      setError(normalized);
    } finally {
      setLoading(false);
    }
  };

  return { airports, loading, error, reload };
}
