import { useState, useCallback, useRef } from 'react';
import type { GeocodingResult } from '../types';

interface UseGeocodingReturn {
  query: string;
  setQuery: (q: string) => void;
  results: GeocodingResult[];
  isLoading: boolean;
  clear: () => void;
}

/**
 * Debounced geocoding search using the Open-Meteo Geocoding API.
 * No API key required. Debounced at 400 ms.
 */
export function useGeocoding(): UseGeocodingReturn {
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);

    // cancel previous request
    controllerRef.current?.abort();
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!q.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search` +
          `?name=${encodeURIComponent(q)}&count=6&language=en&format=json`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setResults(json.results ?? []);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 400);
  }, []);

  const clear = useCallback(() => {
    setQueryState('');
    setResults([]);
    setIsLoading(false);
    controllerRef.current?.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { query, setQuery, results, isLoading, clear };
}
