import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend,
} from 'recharts';
import {
  Thermometer, CloudRain, Wind, Droplets, TrendingUp,
  Sunrise, Sunset, CalendarDays, AlertTriangle, History,
} from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import { useWeather } from '../hooks/useWeather';
import {
  formatTemp, wmoLabel, windDir, formatTime, formatDay, celsiusToF,
} from '../utils/helpers';
import CitySearch from './CitySearch';
import AlertBanner from './AlertBanner';
import AQIPanel from './AQIPanel';
import ComparePanel from './ComparePanel';
import { ErrorBoundary } from './ErrorBoundary';

// ── Tooltip ───────────────────────────────────────────────────
const ChartTooltip = ({
  active, payload, label, unit,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string; name: string }>;
  label?: string;
  unit: 'C' | 'F';
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral-900/95 border border-white/10 rounded px-2 py-1 text-[10px] font-mono shadow-xl">
      <div className="text-neutral-400 mb-0.5">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}:{' '}
          {p.dataKey === 'temp' || p.dataKey === 'tempLY'
            ? formatTemp(p.value, unit)
            : p.dataKey === 'prob' || p.dataKey === 'probMax'
            ? `${p.value}%`
            : `${p.value} mm`}
        </div>
      ))}
    </div>
  );
};

type Tab = 'now' | '7day' | 'aqi' | 'compare';

export default function MeteogramPanel() {
  const {
    selectedLocation, locationName, tempUnit, toggleTempUnit,
    isLoading, historicalData, fetchHistorical,
  } = useWeatherStore();
  const { weatherData, error } = useWeather();
  const [lat, lng] = selectedLocation;
  const [tab, setTab] = useState<Tab>('now');

  const h  = weatherData?.hourly;
  const d  = weatherData?.daily;
  const hy = historicalData?.hourly;
  const wCode = h?.weathercode?.[0];

  // 24-hour chart with rain probability + historical overlay
  const chartData = h
    ? h.time.slice(0, 24).map((t, i) => ({
        time: t.slice(11, 16),
        temp:   h.temperature_2m[i],
        rain:   h.precipitation[i],
        prob:   h.precipitation_probability?.[i] ?? null,
        tempLY: hy?.temperature_2m?.[i] ?? null,
      }))
    : [];

  const sunrise = formatTime(d?.sunrise?.[0]);
  const sunset  = formatTime(d?.sunset?.[0]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'now',     label: 'Current' },
    { id: '7day',    label: '7-Day'   },
    { id: 'aqi',     label: 'AQI'     },
    { id: 'compare', label: 'Compare' },
  ];

  return (
    <div className="flex-1 flex flex-col p-2 gap-1.5 overflow-y-auto min-h-0
                    [scrollbar-width:thin] [scrollbar-color:#404040_transparent]">

      <CitySearch />

      {/* Header */}
      <div className="bg-black/50 p-2 border border-white/10 rounded flex justify-between
                      items-center gap-2 shrink-0">
        <div className="min-w-0">
          <div className="text-[9px] text-neutral-500 uppercase tracking-wider">Location</div>
          <div className="text-[11px] text-white font-semibold truncate">{locationName}</div>
          <div className="font-mono text-[9px] text-neutral-600">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isLoading
            ? <span className="text-yellow-400 text-[9px] animate-pulse">FETCHING…</span>
            : error ? <span className="text-red-400 text-[9px]">ERROR</span>
            : <span className="text-green-400 text-[9px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
              </span>}
          <button
            onClick={toggleTempUnit}
            className="text-[9px] font-mono bg-neutral-800 hover:bg-neutral-700 border
                       border-white/10 rounded px-2 py-0.5 transition-colors"
          >
            °{tempUnit === 'C' ? 'C → °F' : 'F → °C'}
          </button>
        </div>
      </div>

      <AlertBanner />

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded p-2 flex items-center
                        gap-2 shrink-0">
          <AlertTriangle size={12} className="text-red-400 shrink-0" />
          <div>
            <div className="text-[10px] text-red-300 font-medium">Failed to load weather</div>
            <div className="text-[9px] text-red-400/60 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!error && (
        <div className="flex border-b border-white/10 shrink-0">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                if (id === 'now' && !historicalData) fetchHistorical(lat, lng);
              }}
              className={`flex-1 py-1.5 text-[10px] font-medium transition-colors border-b-2 -mb-px ${
                tab === id
                  ? 'text-blue-400 border-blue-500'
                  : 'text-neutral-500 border-transparent hover:text-neutral-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── NOW ── */}
      {tab === 'now' && !error && (
        <>
          {/* Sunrise/Sunset */}
          {(sunrise !== '--' || sunset !== '--') && (
            <div className="flex gap-1 shrink-0">
              <div className="flex-1 bg-black/40 border border-white/10 rounded p-1.5 flex items-center gap-1.5">
                <Sunrise size={12} className="text-orange-400 shrink-0" />
                <div>
                  <div className="text-[8px] text-neutral-500">Sunrise</div>
                  <div className="text-[11px] font-mono text-orange-300">{sunrise}</div>
                </div>
              </div>
              <div className="flex-1 bg-black/40 border border-white/10 rounded p-1.5 flex items-center gap-1.5">
                <Sunset size={12} className="text-purple-400 shrink-0" />
                <div>
                  <div className="text-[8px] text-neutral-500">Sunset</div>
                  <div className="text-[11px] font-mono text-purple-300">{sunset}</div>
                </div>
              </div>
            </div>
          )}

          {/* Current conditions */}
          <div className="grid grid-cols-2 gap-1 shrink-0">
            <div className="bg-black/50 border border-white/10 rounded p-2">
              <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider mb-1">
                <Thermometer size={9} /> Temp
              </div>
              <div className="font-mono text-xl text-white leading-none">
                {formatTemp(h?.temperature_2m?.[0], tempUnit)}
              </div>
              <div className="text-[9px] text-neutral-500 mt-0.5">{wmoLabel(wCode)}</div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded p-2">
              <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider mb-1">
                <CloudRain size={9} /> Rain
              </div>
              <div className="font-mono text-xl text-blue-300 leading-none">
                {h?.precipitation?.[0] ?? '--'}
                <span className="text-xs text-neutral-500"> mm</span>
              </div>
              <div className="text-[9px] text-neutral-500 mt-0.5">
                {h?.precipitation_probability?.[0] != null
                  ? `${h.precipitation_probability[0]}% chance`
                  : '1-hr accumulation'}
              </div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded p-2">
              <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider mb-1">
                <Wind size={9} /> Wind
              </div>
              <div className="font-mono text-xl text-teal-300 leading-none">
                {h?.windspeed_10m?.[0] ?? '--'}
                <span className="text-xs text-neutral-500"> km/h</span>
              </div>
              <div className="text-[9px] text-neutral-500 mt-0.5">
                {windDir(h?.winddirection_10m?.[0])} · {h?.winddirection_10m?.[0] ?? '--'}°
              </div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded p-2">
              <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider mb-1">
                <Droplets size={9} /> Humidity
              </div>
              <div className="font-mono text-xl text-cyan-300 leading-none">
                {h?.relative_humidity_2m?.[0] ?? '--'}
                <span className="text-xs text-neutral-500"> %</span>
              </div>
              <div className="text-[9px] text-neutral-500 mt-0.5">
                UV {h?.uv_index?.[0] ?? '--'} · {h?.surface_pressure?.[0] ?? '--'} hPa
              </div>
            </div>
          </div>

          {/* 24-hr temperature + historical overlay */}
          {chartData.length > 0 && (
            <ErrorBoundary fallbackLabel="Chart failed">
              <div className="bg-black/50 border border-white/10 rounded p-2 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider">
                    <TrendingUp size={9} /> 24-hr Temperature
                  </div>
                  {hy && (
                    <div className="flex items-center gap-1 text-[8px] text-neutral-600">
                      <History size={8} /> vs last year
                    </div>
                  )}
                </div>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#6b7280' }}
                             interval={3} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 8, fill: '#6b7280' }} tickLine={false} axisLine={false}
                             tickFormatter={(v) => tempUnit === 'C' ? `${v}°` : `${celsiusToF(v)}°`} />
                      <Tooltip content={(p) => <ChartTooltip {...p} unit={tempUnit} />}
                               cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />
                      <Line type="monotone" dataKey="temp" name="This year" stroke="#f87171"
                            strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
                      {hy && (
                        <Line type="monotone" dataKey="tempLY" name="Last year" stroke="#6b7280"
                              strokeWidth={1} strokeDasharray="3 2" dot={false} activeDot={{ r: 2 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </ErrorBoundary>
          )}

          {/* 24-hr precipitation + probability */}
          {chartData.length > 0 && (
            <ErrorBoundary fallbackLabel="Chart failed">
              <div className="bg-black/50 border border-white/10 rounded p-2 shrink-0">
                <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider mb-1">
                  <CloudRain size={9} /> 24-hr Precipitation + Probability
                </div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#6b7280' }}
                             interval={3} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="rain" tick={{ fontSize: 8, fill: '#6b7280' }}
                             tickLine={false} axisLine={false} />
                      <YAxis yAxisId="prob" orientation="right" domain={[0, 100]}
                             tick={{ fontSize: 8, fill: '#6b7280' }} tickLine={false} axisLine={false}
                             tickFormatter={(v) => `${v}%`} />
                      <Tooltip content={(p) => <ChartTooltip {...p} unit={tempUnit} />}
                               cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar yAxisId="rain" dataKey="rain" name="Rain mm" fill="#3b82f6"
                           opacity={0.8} radius={[2, 2, 0, 0]} />
                      <Line yAxisId="prob" type="monotone" dataKey="prob" name="Probability"
                            stroke="#a78bfa" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </ErrorBoundary>
          )}

          {isLoading && !weatherData && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-[10px] text-neutral-600 animate-pulse">Loading weather data…</div>
            </div>
          )}
        </>
      )}

      {/* ── 7-DAY ── */}
      {tab === '7day' && !error && (
        <div className="flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider px-1">
            <CalendarDays size={9} /> 7-Day Forecast
          </div>
          {d
            ? d.time.map((date, i) => {
                const isToday = i === 0;
                const prob = d.precipitation_probability_max?.[i];
                return (
                  <div key={date}
                    className={`bg-black/40 border rounded p-2 flex items-center gap-2 ${
                      isToday ? 'border-blue-500/30 bg-blue-900/10' : 'border-white/5'
                    }`}>
                    <div className="w-20 shrink-0">
                      <div className="text-[10px] font-medium text-white">
                        {isToday ? 'Today' : formatDay(date).split(',')[0]}
                      </div>
                      <div className="text-[9px] text-neutral-500">
                        {formatDay(date).split(',').slice(1).join(',').trim()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-neutral-400 truncate">{wmoLabel(d.weathercode[i])}</div>
                      <div className="text-[9px] text-blue-400">
                        {(d.precipitation_sum[i] ?? 0) > 0
                          ? `${d.precipitation_sum[i].toFixed(1)} mm`
                          : 'No rain'}
                        {prob != null && (
                          <span className="text-purple-400 ml-1">({prob}%)</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-mono">
                        <span className="text-red-400">{formatTemp(d.temperature_2m_max[i], tempUnit)}</span>
                        <span className="text-neutral-600 mx-0.5">/</span>
                        <span className="text-blue-400">{formatTemp(d.temperature_2m_min[i], tempUnit)}</span>
                      </div>
                      <div className="text-[9px] text-neutral-600">
                        UV {d.uv_index_max?.[i]?.toFixed(0) ?? '--'} · {d.windspeed_10m_max?.[i]?.toFixed(0) ?? '--'} km/h
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-0.5 text-[8px] text-orange-400/70">
                        <Sunrise size={8} />{formatTime(d.sunrise[i])}
                      </div>
                      <div className="flex items-center gap-0.5 text-[8px] text-purple-400/70">
                        <Sunset size={8} />{formatTime(d.sunset[i])}
                      </div>
                    </div>
                  </div>
                );
              })
            : isLoading
            ? Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-12 bg-neutral-800/40 rounded animate-pulse" />
              ))
            : null}
        </div>
      )}

      {/* ── AQI ── */}
      {tab === 'aqi' && <AQIPanel />}

      {/* ── COMPARE ── */}
      {tab === 'compare' && <ComparePanel />}
    </div>
  );
}
