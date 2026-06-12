import React, { useEffect, useState } from 'react';
import { GitCompare, Plus, X, Thermometer, CloudRain, Wind, Droplets, Sun } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import { useGeocoding } from '../hooks/useGeocoding';
import { formatTemp, wmoLabel } from '../utils/helpers';
import type { CompareLocation, WeatherData } from '../types';

// ── mini search for compare locations ───────────────────────
function CompareSearch({ onSelect }: { onSelect: (loc: CompareLocation) => void }) {
  const { query, setQuery, results, isLoading, clear } = useGeocoding();

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded px-2 py-1.5">
        <Plus size={10} className="text-neutral-500 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Add city to compare…"
          className="flex-1 bg-transparent text-[10px] text-neutral-200 placeholder-neutral-600 outline-none"
        />
        {isLoading && (
          <div className="w-2 h-2 border border-blue-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900/98 border border-white/10
                        rounded shadow-2xl z-50 overflow-hidden">
          {results.slice(0, 4).map((r) => (
            <button
              key={r.id}
              className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors
                         border-b border-white/5 last:border-0"
              onClick={() => {
                onSelect({
                  id: `${r.latitude.toFixed(4)}_${r.longitude.toFixed(4)}`,
                  name: `${r.name}${r.country ? ', ' + r.country : ''}`,
                  lat: r.latitude,
                  lng: r.longitude,
                  weatherData: null,
                });
                clear();
              }}
            >
              <div className="text-[10px] text-white font-medium">{r.name}</div>
              <div className="text-[9px] text-neutral-500">
                {[r.admin1, r.country].filter(Boolean).join(', ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── single city column ────────────────────────────────────────
function CityColumn({
  loc, tempUnit, onRemove, isCurrent,
}: {
  loc: CompareLocation & { weatherData: WeatherData | null };
  tempUnit: 'C' | 'F';
  onRemove?: () => void;
  isCurrent: boolean;
}) {
  const h = loc.weatherData?.hourly;
  const d = loc.weatherData?.daily;
  const wCode = h?.weathercode?.[0];

  return (
    <div className={`flex-1 min-w-0 flex flex-col gap-1.5 p-2 rounded border ${
      isCurrent ? 'border-blue-500/30 bg-blue-900/10' : 'border-white/5 bg-black/20'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="text-[9px] text-neutral-500 uppercase tracking-wider">
            {isCurrent ? 'Current' : 'Compare'}
          </div>
          <div className="text-[10px] font-semibold text-white truncate">{loc.name}</div>
        </div>
        {!isCurrent && onRemove && (
          <button onClick={onRemove} className="shrink-0 text-neutral-600 hover:text-white">
            <X size={10} />
          </button>
        )}
      </div>

      {/* Condition */}
      <div className="text-[9px] text-neutral-400 truncate">
        {wCode != null ? wmoLabel(wCode) : '—'}
      </div>

      {/* Temperature */}
      <div className="flex items-end gap-1">
        <Thermometer size={10} className="text-red-400 shrink-0 mb-0.5" />
        <span className="text-xl font-mono text-white leading-none">
          {formatTemp(h?.temperature_2m?.[0], tempUnit)}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-1 text-[9px]">
        <div className="flex items-center gap-1 text-blue-400">
          <CloudRain size={9} />
          {h?.precipitation?.[0]?.toFixed(1) ?? '--'} mm
        </div>
        <div className="flex items-center gap-1 text-teal-400">
          <Wind size={9} />
          {h?.windspeed_10m?.[0]?.toFixed(0) ?? '--'} km/h
        </div>
        <div className="flex items-center gap-1 text-cyan-400">
          <Droplets size={9} />
          {h?.relative_humidity_2m?.[0] ?? '--'}%
        </div>
        <div className="flex items-center gap-1 text-yellow-400">
          <Sun size={9} />
          UV {h?.uv_index?.[0]?.toFixed(0) ?? '--'}
        </div>
      </div>

      {/* 7-day mini forecast */}
      {d && (
        <div className="flex flex-col gap-0.5 pt-1 border-t border-white/5">
          {d.time.slice(0, 5).map((date, i) => (
            <div key={date} className="flex items-center gap-1 text-[9px]">
              <span className="text-neutral-600 w-7 shrink-0">
                {new Date(date).toLocaleDateString([], { weekday: 'short' })}
              </span>
              <span className="text-red-400 font-mono">
                {formatTemp(d.temperature_2m_max[i], tempUnit)}
              </span>
              <span className="text-neutral-600">/</span>
              <span className="text-blue-400 font-mono">
                {formatTemp(d.temperature_2m_min[i], tempUnit)}
              </span>
              {(d.precipitation_sum[i] ?? 0) > 0 && (
                <span className="text-blue-500 ml-auto">
                  {d.precipitation_sum[i].toFixed(0)}mm
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {!h && (
        <div className="text-[9px] text-neutral-600 animate-pulse">Loading…</div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function ComparePanel() {
  const {
    selectedLocation, locationName, weatherData, tempUnit,
    compareLocations, addCompareLocation, removeCompareLocation,
    fetchCompareWeather,
  } = useWeatherStore();

  const [lat, lng] = selectedLocation;
  const [open, setOpen] = useState(false);

  // fetch weather for any compare location that doesn't have data yet
  useEffect(() => {
    compareLocations.forEach((loc) => {
      if (!loc.weatherData) fetchCompareWeather(loc.id, loc.lat, loc.lng);
    });
  }, [compareLocations, fetchCompareWeather]);

  const currentLoc: CompareLocation & { weatherData: WeatherData | null } = {
    id: 'current',
    name: locationName,
    lat,
    lng,
    weatherData: weatherData ?? null,
  };

  const canAdd = compareLocations.length < 2;

  return (
    <div className="flex flex-col gap-2 shrink-0">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[9px] text-neutral-500
                   hover:text-neutral-300 transition-colors"
      >
        <GitCompare size={10} />
        <span className="uppercase tracking-wider">Compare locations</span>
        <span className="ml-auto">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-2">
          {/* City columns */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <CityColumn
              loc={currentLoc}
              tempUnit={tempUnit}
              isCurrent
            />
            {compareLocations.map((loc) => (
              <CityColumn
                key={loc.id}
                loc={loc as CompareLocation & { weatherData: WeatherData | null }}
                tempUnit={tempUnit}
                isCurrent={false}
                onRemove={() => removeCompareLocation(loc.id)}
              />
            ))}
          </div>

          {/* Add city search */}
          {canAdd && (
            <CompareSearch
              onSelect={(loc) => {
                addCompareLocation(loc);
                fetchCompareWeather(loc.id, loc.lat, loc.lng);
              }}
            />
          )}
          {!canAdd && (
            <div className="text-[9px] text-neutral-600 text-center">
              Max 2 comparison cities — remove one to add another
            </div>
          )}
        </div>
      )}
    </div>
  );
}
