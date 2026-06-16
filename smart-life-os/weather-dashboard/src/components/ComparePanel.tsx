import React, { useEffect, useState } from 'react';
import { GitCompare, Plus, X, Thermometer, CloudRain, Wind, Droplets, Sun, MapPin } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import { useGeocoding } from '../hooks/useGeocoding';
import { formatTemp, wmoLabel } from '../utils/helpers';
import type { CompareLocation, WeatherData } from '../types';

const QUICK_COMPARE = [
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { name: 'Chon Buri', lat: 13.3611, lng: 100.9847 },
  { name: 'Rayong', lat: 12.6814, lng: 101.2816 },
];

function toCompareLocation(name: string, lat: number, lng: number): CompareLocation {
  return { id: `${lat.toFixed(4)}_${lng.toFixed(4)}`, name, lat, lng, weatherData: null };
}

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
        {isLoading && <div className="w-2 h-2 border border-blue-400 border-t-transparent rounded-full animate-spin" />}
      </div>
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900/98 border border-white/10 rounded shadow-2xl z-50 overflow-hidden">
          {results.slice(0, 4).map((r) => (
            <button
              key={r.id}
              className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              onClick={() => {
                onSelect(toCompareLocation(`${r.name}${r.country ? ', ' + r.country : ''}`, r.latitude, r.longitude));
                clear();
              }}
            >
              <div className="text-[10px] text-white font-medium">{r.name}</div>
              <div className="text-[9px] text-neutral-500">{[r.admin1, r.country].filter(Boolean).join(', ')}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CityColumn({ loc, tempUnit, onRemove, isCurrent }: {
  loc: CompareLocation & { weatherData: WeatherData | null };
  tempUnit: 'C' | 'F';
  onRemove?: () => void;
  isCurrent: boolean;
}) {
  const h = loc.weatherData?.hourly;
  const d = loc.weatherData?.daily;
  const wCode = h?.weathercode?.[0];
  const rain = h?.precipitation?.[0] ?? 0;

  return (
    <div className={`min-w-[148px] flex-1 flex flex-col gap-1.5 p-2 rounded-lg border ${isCurrent ? 'border-blue-500/35 bg-blue-900/10' : 'border-white/5 bg-black/25'}`}>
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="text-[8px] text-neutral-500 uppercase tracking-wider flex items-center gap-1">
            <MapPin size={8} /> {isCurrent ? 'Current' : 'Compare'}
          </div>
          <div className="text-[10px] font-semibold text-white truncate">{loc.name}</div>
        </div>
        {!isCurrent && onRemove && <button onClick={onRemove} className="shrink-0 text-neutral-600 hover:text-white"><X size={10} /></button>}
      </div>

      <div className="text-[9px] text-neutral-400 truncate">{wCode != null ? wmoLabel(wCode) : 'Loading weather…'}</div>

      <div className="flex items-end gap-1">
        <Thermometer size={10} className="text-red-400 shrink-0 mb-0.5" />
        <span className="text-xl font-mono text-white leading-none">{formatTemp(h?.temperature_2m?.[0], tempUnit)}</span>
      </div>

      <div className="grid grid-cols-2 gap-1 text-[9px]">
        <div className={`${rain > 0 ? 'text-blue-300' : 'text-neutral-600'} flex items-center gap-1`}><CloudRain size={9} />{h?.precipitation?.[0]?.toFixed(1) ?? '--'} mm</div>
        <div className="flex items-center gap-1 text-teal-400"><Wind size={9} />{h?.windspeed_10m?.[0]?.toFixed(0) ?? '--'} km/h</div>
        <div className="flex items-center gap-1 text-cyan-400"><Droplets size={9} />{h?.relative_humidity_2m?.[0] ?? '--'}%</div>
        <div className="flex items-center gap-1 text-yellow-400"><Sun size={9} />UV {h?.uv_index?.[0]?.toFixed(0) ?? '--'}</div>
      </div>

      {d && (
        <div className="flex flex-col gap-0.5 pt-1 border-t border-white/5">
          {d.time.slice(0, 3).map((date, i) => (
            <div key={date} className="flex items-center gap-1 text-[9px]">
              <span className="text-neutral-600 w-7 shrink-0">{new Date(date).toLocaleDateString([], { weekday: 'short' })}</span>
              <span className="text-red-400 font-mono">{formatTemp(d.temperature_2m_max[i], tempUnit)}</span>
              <span className="text-neutral-600">/</span>
              <span className="text-blue-400 font-mono">{formatTemp(d.temperature_2m_min[i], tempUnit)}</span>
              {(d.precipitation_sum[i] ?? 0) > 0 && <span className="text-blue-500 ml-auto">{d.precipitation_sum[i].toFixed(0)}mm</span>}
            </div>
          ))}
        </div>
      )}

      {!h && <div className="text-[9px] text-neutral-600 animate-pulse">Loading…</div>}
    </div>
  );
}

export default function ComparePanel() {
  const {
    selectedLocation, locationName, weatherData, tempUnit,
    compareLocations, addCompareLocation, removeCompareLocation,
    fetchCompareWeather,
  } = useWeatherStore();

  const [lat, lng] = selectedLocation;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    compareLocations.forEach((loc) => {
      if (!loc.weatherData) fetchCompareWeather(loc.id, loc.lat, loc.lng);
    });
  }, [compareLocations, fetchCompareWeather]);

  const currentLoc: CompareLocation & { weatherData: WeatherData | null } = {
    id: 'current', name: locationName, lat, lng, weatherData: weatherData ?? null,
  };

  const canAdd = compareLocations.length < 3;

  const addLoc = (loc: CompareLocation) => {
    addCompareLocation(loc);
    fetchCompareWeather(loc.id, loc.lat, loc.lng);
  };

  return (
    <div className="flex flex-col gap-2 shrink-0">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-[9px] text-neutral-500 hover:text-neutral-300 transition-colors">
        <GitCompare size={10} />
        <span className="uppercase tracking-wider">Compare locations</span>
        <span className="ml-auto">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-1 flex-wrap">
            {QUICK_COMPARE.map((city) => (
              <button
                key={city.name}
                onClick={() => addLoc(toCompareLocation(city.name, city.lat, city.lng))}
                disabled={!canAdd}
                className="px-2 py-1 rounded border border-white/10 bg-black/30 text-[9px] text-neutral-400 hover:text-white disabled:opacity-40"
              >
                + {city.name}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <CityColumn loc={currentLoc} tempUnit={tempUnit} isCurrent />
            {compareLocations.map((loc) => (
              <CityColumn key={loc.id} loc={loc as CompareLocation & { weatherData: WeatherData | null }} tempUnit={tempUnit} isCurrent={false} onRemove={() => removeCompareLocation(loc.id)} />
            ))}
          </div>

          {canAdd ? <CompareSearch onSelect={addLoc} /> : <div className="text-[9px] text-neutral-600 text-center">Max 3 comparison cities — remove one to add another</div>}
        </div>
      )}
    </div>
  );
}
