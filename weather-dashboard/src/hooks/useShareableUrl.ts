import { useEffect, useCallback } from 'react';
import { useWeatherStore } from '../store/weatherStore';

/**
 * Syncs selected location + unit to/from the URL query string.
 *
 * On mount:  reads ?lat=&lng=&unit=&name= and applies them to the store.
 * On change: updates the URL without a full page reload (replaceState).
 *
 * Usage: call once in App.tsx — `useShareableUrl()`.
 */
export function useShareableUrl() {
  const { selectedLocation, locationName, tempUnit, setSelectedLocation, toggleTempUnit } =
    useWeatherStore();

  // ── Read URL params on first mount ──────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat  = parseFloat(params.get('lat')  ?? '');
    const lng  = parseFloat(params.get('lng')  ?? '');
    const unit = params.get('unit');
    const name = params.get('name') ?? undefined;

    if (!isNaN(lat) && !isNaN(lng)) {
      setSelectedLocation(lat, lng, name);
    }

    // Apply unit if different from current store value
    const currentUnit = useWeatherStore.getState().tempUnit;
    if (unit === 'F' && currentUnit !== 'F') toggleTempUnit();
    if (unit === 'C' && currentUnit !== 'C') toggleTempUnit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount only

  // ── Write URL on store change ────────────────────────────
  useEffect(() => {
    const [lat, lng] = selectedLocation;
    const params = new URLSearchParams({
      lat:  lat.toFixed(4),
      lng:  lng.toFixed(4),
      unit: tempUnit,
      ...(locationName ? { name: locationName } : {}),
    });
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [selectedLocation, tempUnit, locationName]);

  // ── Return a copy-to-clipboard helper ───────────────────
  const copyShareLink = useCallback((): Promise<void> => {
    return navigator.clipboard.writeText(window.location.href);
  }, []);

  return { copyShareLink };
}
