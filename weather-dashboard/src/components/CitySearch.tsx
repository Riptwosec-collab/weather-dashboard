import React, { useState } from 'react';
import { Search, X, MapPin, Bookmark, BookmarkCheck, LocateFixed, Navigation } from 'lucide-react';
import { useGeocoding } from '../hooks/useGeocoding';
import { useWeatherStore } from '../store/weatherStore';
import type { SavedLocation } from '../types';

const QUICK_CITIES = [
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { name: 'Chon Buri', lat: 13.3611, lng: 100.9847 },
  { name: 'Ayutthaya', lat: 14.3692, lng: 100.5877 },
  { name: 'Chiang Mai', lat: 18.7883, lng: 98.9853 },
];

export default function CitySearch() {
  const { setSelectedLocation, savedLocations, saveLocation, removeLocation, selectedLocation, locationName } =
    useWeatherStore();
  const { query, setQuery, results, isLoading, clear } = useGeocoding();
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [lat, lng] = selectedLocation;

  const isSaved = savedLocations.some(
    (l) => Math.abs(l.lat - lat) < 0.01 && Math.abs(l.lng - lng) < 0.01
  );

  const handleSave = () => {
    if (isSaved) {
      const found = savedLocations.find(
        (l) => Math.abs(l.lat - lat) < 0.01 && Math.abs(l.lng - lng) < 0.01
      );
      if (found) removeLocation(found.id);
      return;
    }

    const loc: SavedLocation = {
      id: `${lat.toFixed(4)}_${lng.toFixed(4)}`,
      name: locationName,
      lat,
      lng,
      addedAt: Date.now(),
    };
    saveLocation(loc);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedLocation(pos.coords.latitude, pos.coords.longitude, 'My Location');
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(err.message);
        setGeoLoading(false);
      },
      { timeout: 10_000 }
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        <div className="relative flex-1">
          <div className="premium-input flex items-center gap-1.5 rounded px-2 py-1.5">
            <Search size={11} className="text-neutral-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city..."
              className="flex-1 bg-transparent text-[11px] text-neutral-200 placeholder-neutral-600 outline-none min-w-0"
            />
            {query && (
              <button onClick={clear} className="shrink-0">
                <X size={10} className="text-neutral-500 hover:text-white" />
              </button>
            )}
            {isLoading && (
              <div className="w-2 h-2 border border-[color:var(--accent)] border-t-transparent rounded-full animate-spin shrink-0" />
            )}
          </div>

          {results.length > 0 && (
            <div className="premium-menu absolute top-full left-0 right-0 mt-1 rounded z-50 overflow-hidden">
              {results.map((r) => (
                <button
                  key={r.id}
                  className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  onClick={() => {
                    setSelectedLocation(
                      r.latitude,
                      r.longitude,
                      `${r.name}${r.country ? ', ' + r.country : ''}`
                    );
                    clear();
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin size={9} className="text-[color:var(--accent)] shrink-0" />
                    <span className="text-[11px] text-white font-medium truncate">{r.name}</span>
                  </div>
                  <div className="text-[9px] text-neutral-500 pl-4">
                    {[r.admin1, r.country].filter(Boolean).join(', ')} |{' '}
                    {r.latitude.toFixed(2)}, {r.longitude.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          title={isSaved ? 'Remove bookmark' : 'Bookmark this location'}
          className={`shrink-0 w-8 flex items-center justify-center rounded transition-colors ${
            isSaved
              ? 'premium-chip-active'
              : 'premium-chip hover:text-white hover:border-white/20'
          }`}
        >
          {isSaved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
        </button>
      </div>

      <div className="flex gap-1">
        <button
          onClick={handleCurrentLocation}
          disabled={geoLoading}
          className="premium-chip premium-chip-active flex-1 flex items-center justify-center gap-1.5 text-[9px] font-semibold
                     rounded py-1 transition disabled:opacity-60 hover:brightness-110"
        >
          {geoLoading ? <span className="w-2 h-2 border border-[color:var(--accent)] border-t-transparent rounded-full animate-spin" /> : <Navigation size={9} />}
          Use My Location
        </button>
        {QUICK_CITIES.map((city) => (
          <button
            key={city.name}
            onClick={() => setSelectedLocation(city.lat, city.lng, city.name)}
            className="premium-chip px-2 py-1 rounded text-[9px] hover:text-white hover:border-white/20 transition-colors"
          >
            {city.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {geoError && (
        <div className="text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
          {geoError}
        </div>
      )}

      {savedLocations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {savedLocations.map((loc) => {
            const isActive =
              Math.abs(loc.lat - lat) < 0.01 && Math.abs(loc.lng - lng) < 0.01;
            return (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc.lat, loc.lng, loc.name)}
                className={`group flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] transition-colors ${
                  isActive
                    ? 'premium-chip-active'
                    : 'premium-chip hover:text-white hover:border-white/20'
                }`}
              >
                <LocateFixed size={8} />
                <span className="truncate max-w-[80px]">{loc.name}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLocation(loc.id);
                  }}
                  className="hidden group-hover:inline text-neutral-500 hover:text-red-400 ml-0.5"
                >
                  x
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
