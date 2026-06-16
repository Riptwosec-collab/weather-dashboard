import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, BarChart, Bar, ReferenceDot,
} from 'recharts';
import {
  Thermometer, CloudRain, Wind, Droplets, TrendingUp,
  Sunrise, Sunset, CalendarDays, AlertTriangle, History,
  Sparkles, MapPin,
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

const ChartTooltip = ({ active, payload, label, unit }: {
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
          {p.name}: {p.dataKey === 'temp' || p.dataKey === 'tempLY'
            ? formatTemp(p.value, unit)
            : p.dataKey === 'prob' ? `${p.value}%` : `${p.value} mm`}
        </div>
      ))}
    </div>
  );
};

type Tab = 'now' | '7day' | 'aqi' | 'compare';
type Tone = 'temp' | 'rain' | 'wind' | 'humidity';

function toneClass(tone: Tone, n?: number) {
  if (tone === 'temp') return (n ?? 0) >= 35 ? 'border-orange-400/40 bg-orange-500/10 shadow-[0_0_26px_rgba(249,115,22,0.18)]' : (n ?? 0) >= 30 ? 'border-yellow-400/25 bg-yellow-500/10' : 'border-white/10 bg-black/50';
  if (tone === 'rain') return (n ?? 0) >= 5 ? 'border-blue-300/40 bg-blue-500/15 shadow-[0_0_26px_rgba(59,130,246,0.18)]' : (n ?? 0) > 0 ? 'border-blue-500/25 bg-blue-500/10' : 'border-white/10 bg-black/50';
  if (tone === 'wind') return (n ?? 0) >= 40 ? 'border-teal-300/40 bg-teal-500/15' : (n ?? 0) >= 20 ? 'border-teal-500/25 bg-teal-500/10' : 'border-white/10 bg-black/50';
  return (n ?? 0) >= 90 ? 'border-cyan-300/40 bg-cyan-500/15' : (n ?? 0) >= 75 ? 'border-cyan-500/25 bg-cyan-500/10' : 'border-white/10 bg-black/50';
}

function StatCard({ icon: Icon, label, value, numeric, suffix, sub, tone, color }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: React.ReactNode;
  numeric?: number;
  suffix?: string;
  sub: React.ReactNode;
  tone: Tone;
  color: string;
}) {
  return (
    <div className={`border rounded p-2 transition-all ${toneClass(tone, numeric)}`}>
      <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider mb-1">
        <Icon size={9} /> {label}
      </div>
      <div className={`font-mono text-xl leading-none ${color}`}>
        {value}{suffix && <span className="text-xs text-neutral-500"> {suffix}</span>}
      </div>
      <div className="text-[9px] text-neutral-500 mt-0.5">{sub}</div>
    </div>
  );
}

export default function MeteogramPanel() {
  const {
    selectedLocation, locationName, tempUnit, toggleTempUnit,
    isLoading, historicalData, fetchHistorical, currentTime,
  } = useWeatherStore();
  const { weatherData, error } = useWeather();
  const [lat, lng] = selectedLocation;
  const [tab, setTab] = useState<Tab>('now');

  const h = weatherData?.hourly;
  const d = weatherData?.daily;
  const hy = historicalData?.hourly;
  const idx = h ? Math.min(currentTime, h.time.length - 1) : 0;

  const chartData = h ? h.time.slice(0, 24).map((t, i) => ({
    time: t.slice(11, 16),
    temp: h.temperature_2m[i],
    rain: h.precipitation[i],
    prob: h.precipitation_probability?.[i] ?? null,
    tempLY: hy?.temperature_2m?.[i] ?? null,
  })) : [];

  const peakTemp = chartData.reduce((m, x) => x.temp > m.temp ? x : m, chartData[0] ?? { time: '', temp: 0, rain: 0 });
  const peakRain = chartData.reduce((m, x) => x.rain > m.rain ? x : m, chartData[0] ?? { time: '', temp: 0, rain: 0 });

  const curTemp = h?.temperature_2m?.[idx];
  const curRain = h?.precipitation?.[idx];
  const curProb = h?.precipitation_probability?.[idx];
  const curWind = h?.windspeed_10m?.[idx];
  const curDir = h?.winddirection_10m?.[idx];
  const curHumidity = h?.relative_humidity_2m?.[idx];
  const updatedAt = weatherData ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';

  const insights = useMemo(() => {
    if (!h) return [];
    const nextRain = h.precipitation.slice(idx, idx + 3);
    const nextProb = h.precipitation_probability?.slice(idx, idx + 3) ?? [];
    const maxRain = Math.max(...nextRain, 0);
    const maxProb = Math.max(...nextProb, 0);
    const humidity = h.relative_humidity_2m?.[idx] ?? 0;
    const wind = h.windspeed_10m?.[idx] ?? 0;
    const dir = windDir(h.winddirection_10m?.[idx]);
    return [
      maxRain > 0 || maxProb >= 50 ? `Rain likely soon: ${maxRain.toFixed(1)} mm / ${maxProb}% in next 3h` : 'Low rain signal in the next 3 hours',
      humidity >= 90 ? 'Humidity very high' : humidity >= 75 ? 'Humidity elevated' : 'Humidity comfortable',
      wind >= 40 ? `Strong wind from ${dir}` : wind >= 20 ? `Moderate wind from ${dir}` : `Wind light from ${dir}`,
    ];
  }, [h, idx]);

  const riskCards = useMemo(() => {
    if (!h) return [];
    const maxRain = Math.max(...h.precipitation.slice(idx, idx + 3), 0);
    const maxProb = Math.max(...(h.precipitation_probability?.slice(idx, idx + 3) ?? [0]), 0);
    const humidity = h.relative_humidity_2m?.[idx] ?? 0;
    const wind = h.windspeed_10m?.[idx] ?? 0;
    const items: Array<{ title: string; body: string; tone: string }> = [];
    if (maxRain >= 5 || maxProb >= 75) items.push({ title: 'Heavy Rain Risk', body: `Possible heavy rain in next 3 hours (${maxRain.toFixed(1)} mm / ${maxProb}%)`, tone: 'border-blue-400/30 bg-blue-500/10 text-blue-200' });
    if (humidity >= 90) items.push({ title: 'High Humidity', body: 'Humidity is very high and may feel uncomfortable.', tone: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200' });
    if (wind >= 40) items.push({ title: 'Strong Wind', body: `Wind speed around ${wind.toFixed(0)} km/h.`, tone: 'border-teal-400/30 bg-teal-500/10 text-teal-200' });
    return items;
  }, [h, idx]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'now', label: 'Current' }, { id: '7day', label: '7-Day' },
    { id: 'aqi', label: 'AQI' }, { id: 'compare', label: 'Compare' },
  ];

  return (
    <div className="flex-1 flex flex-col p-2 gap-1.5 overflow-y-auto min-h-0 [scrollbar-width:thin] [scrollbar-color:#404040_transparent]">
      <CitySearch />

      <div className="bg-black/55 p-2.5 border border-white/10 rounded-lg flex justify-between items-start gap-2 shrink-0 shadow-[0_0_24px_rgba(0,0,0,0.25)]">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider mb-0.5"><MapPin size={9} /> Location</div>
          <div className="text-[14px] text-white font-bold truncate leading-tight">{locationName}</div>
          <div className="font-mono text-[9px] text-neutral-500 mt-0.5">Lat {lat.toFixed(4)} / Lng {lng.toFixed(4)}</div>
          <div className="font-mono text-[8px] text-neutral-600 mt-0.5">Updated {updatedAt}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isLoading ? <span className="text-yellow-400 text-[9px] animate-pulse">FETCHING…</span> : error ? <span className="text-red-400 text-[9px]">ERROR</span> : <span className="text-green-400 text-[9px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE</span>}
          <button onClick={toggleTempUnit} className="text-[9px] font-mono bg-neutral-800 hover:bg-neutral-700 border border-white/10 rounded px-2 py-0.5 transition-colors">°{tempUnit === 'C' ? 'C → °F' : 'F → °C'}</button>
        </div>
      </div>

      {!error && insights.length > 0 && (
        <div className="bg-blue-950/20 border border-blue-400/15 rounded-lg p-2 shrink-0">
          <div className="flex items-center gap-1 text-[9px] text-blue-300 uppercase tracking-wider mb-1"><Sparkles size={10} /> Mini Weather Summary</div>
          {insights.map((item) => <div key={item} className="text-[9px] text-neutral-300 leading-relaxed">• {item}</div>)}
        </div>
      )}

      <AlertBanner />

      {riskCards.length > 0 && <div className="flex flex-col gap-1 shrink-0">{riskCards.map((item) => <div key={item.title} className={`border rounded p-2 text-[9px] ${item.tone}`}><div className="font-semibold text-[10px]">{item.title}</div><div className="opacity-80 mt-0.5">{item.body}</div></div>)}</div>}

      {error && <div className="bg-red-900/30 border border-red-500/30 rounded p-2 flex items-center gap-2 shrink-0"><AlertTriangle size={12} className="text-red-400 shrink-0" /><div><div className="text-[10px] text-red-300 font-medium">Failed to load weather</div><div className="text-[9px] text-red-400/60 mt-0.5">{error}</div></div></div>}

      {!error && <div className="flex border-b border-white/10 shrink-0">{tabs.map(({ id, label }) => <button key={id} onClick={() => { setTab(id); if (id === 'now' && !historicalData) fetchHistorical(lat, lng); }} className={`flex-1 py-1.5 text-[10px] font-medium transition-colors border-b-2 -mb-px ${tab === id ? 'text-blue-400 border-blue-500' : 'text-neutral-500 border-transparent hover:text-neutral-300'}`}>{label}</button>)}</div>}

      {tab === 'now' && !error && <>
        {((formatTime(d?.sunrise?.[0]) !== '--') || (formatTime(d?.sunset?.[0]) !== '--')) && <div className="flex gap-1 shrink-0"><div className="flex-1 bg-black/40 border border-white/10 rounded p-1.5 flex items-center gap-1.5"><Sunrise size={12} className="text-orange-400 shrink-0" /><div><div className="text-[8px] text-neutral-500">Sunrise</div><div className="text-[11px] font-mono text-orange-300">{formatTime(d?.sunrise?.[0])}</div></div></div><div className="flex-1 bg-black/40 border border-white/10 rounded p-1.5 flex items-center gap-1.5"><Sunset size={12} className="text-purple-400 shrink-0" /><div><div className="text-[8px] text-neutral-500">Sunset</div><div className="text-[11px] font-mono text-purple-300">{formatTime(d?.sunset?.[0])}</div></div></div></div>}

        {h ? <div className="grid grid-cols-2 gap-1 shrink-0"><StatCard icon={Thermometer} label="Temp" value={formatTemp(curTemp, tempUnit)} numeric={curTemp} sub={wmoLabel(h.weathercode?.[idx])} tone="temp" color="text-white" /><StatCard icon={CloudRain} label="Rain" value={curRain ?? '--'} numeric={curRain} suffix="mm" sub={curProb != null ? `${curProb}% chance` : '1-hr accumulation'} tone="rain" color="text-blue-300" /><StatCard icon={Wind} label="Wind" value={curWind ?? '--'} numeric={curWind} suffix="km/h" sub={`${windDir(curDir)} · ${curDir ?? '--'}°`} tone="wind" color="text-teal-300" /><StatCard icon={Droplets} label="Humidity" value={curHumidity ?? '--'} numeric={curHumidity} suffix="%" sub={`UV ${h?.uv_index?.[idx] ?? '--'} · ${h?.surface_pressure?.[idx] ?? '--'} hPa`} tone="humidity" color="text-cyan-300" /></div> : isLoading ? <div className="flex-1 flex items-center justify-center bg-black/30 border border-white/5 rounded p-4"><div className="flex items-center gap-2 text-[10px] text-neutral-500"><div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />Loading weather data…</div></div> : null}

        {chartData.length > 0 && <ErrorBoundary fallbackLabel="Chart failed"><div className="bg-black/50 border border-white/10 rounded p-2 shrink-0"><div className="flex items-center justify-between mb-1"><div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider"><TrendingUp size={9} /> 24-hr Temperature</div><div className="flex items-center gap-2 text-[8px] text-neutral-600"><span>Peak {formatTemp(peakTemp.temp, tempUnit)} at {peakTemp.time}</span>{hy && <span className="flex items-center gap-1"><History size={8} /> vs last year</span>}</div></div><div className="h-28"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}><CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" /><XAxis dataKey="time" tick={{ fontSize: 8, fill: '#6b7280' }} interval={3} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 8, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={(v) => tempUnit === 'C' ? `${v}°` : `${celsiusToF(v)}°`} /><Tooltip content={(p) => <ChartTooltip {...p} unit={tempUnit} />} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} /><Line type="monotone" dataKey="temp" name="This year" stroke="#f87171" strokeWidth={2} dot={false} activeDot={{ r: 4 }} /><ReferenceDot x={peakTemp.time} y={peakTemp.temp} r={3} fill="#f97316" stroke="#fed7aa" />{hy && <Line type="monotone" dataKey="tempLY" name="Last year" stroke="#6b7280" strokeWidth={1} strokeDasharray="3 2" dot={false} activeDot={{ r: 2 }} />}</LineChart></ResponsiveContainer></div></div></ErrorBoundary>}

        {chartData.length > 0 && <ErrorBoundary fallbackLabel="Chart failed"><div className="bg-black/50 border border-white/10 rounded p-2 shrink-0"><div className="flex items-center justify-between mb-1"><div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider"><CloudRain size={9} /> 24-hr Precipitation + Probability</div><div className="text-[8px] text-neutral-600">Peak {peakRain.rain.toFixed(1)} mm at {peakRain.time}</div></div><div className="h-24"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}><CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} /><XAxis dataKey="time" tick={{ fontSize: 8, fill: '#6b7280' }} interval={3} tickLine={false} axisLine={false} /><YAxis yAxisId="rain" tick={{ fontSize: 8, fill: '#6b7280' }} tickLine={false} axisLine={false} /><YAxis yAxisId="prob" orientation="right" domain={[0, 100]} tick={{ fontSize: 8, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} /><Tooltip content={(p) => <ChartTooltip {...p} unit={tempUnit} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} /><Bar yAxisId="rain" dataKey="rain" name="Rain mm" fill="#3b82f6" opacity={0.88} radius={[2, 2, 0, 0]} /><Line yAxisId="prob" type="monotone" dataKey="prob" name="Probability" stroke="#a78bfa" strokeWidth={1.8} dot={false} activeDot={{ r: 3 }} /></BarChart></ResponsiveContainer></div></div></ErrorBoundary>}
      </>}

      {tab === '7day' && !error && <div className="flex flex-col gap-1 shrink-0"><div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider px-1"><CalendarDays size={9} /> 7-Day Forecast</div>{d ? d.time.map((date, i) => { const isToday = i === 0; const prob = d.precipitation_probability_max?.[i]; return <div key={date} className={`bg-black/40 border rounded p-2 flex items-center gap-2 ${isToday ? 'border-blue-500/30 bg-blue-900/10' : 'border-white/5'}`}><div className="w-20 shrink-0"><div className="text-[10px] font-medium text-white">{isToday ? 'Today' : formatDay(date).split(',')[0]}</div><div className="text-[9px] text-neutral-500">{formatDay(date).split(',').slice(1).join(',').trim()}</div></div><div className="flex-1 min-w-0"><div className="text-[9px] text-neutral-400 truncate">{wmoLabel(d.weathercode[i])}</div><div className="text-[9px] text-blue-400">{(d.precipitation_sum[i] ?? 0) > 0 ? `${d.precipitation_sum[i].toFixed(1)} mm` : 'No rain'}{prob != null && <span className="text-purple-400 ml-1">({prob}%)</span>}</div></div><div className="text-right shrink-0"><div className="text-[11px] font-mono"><span className="text-red-400">{formatTemp(d.temperature_2m_max[i], tempUnit)}</span><span className="text-neutral-600 mx-0.5">/</span><span className="text-blue-400">{formatTemp(d.temperature_2m_min[i], tempUnit)}</span></div><div className="text-[9px] text-neutral-600">UV {d.uv_index_max?.[i]?.toFixed(0) ?? '--'} · {d.windspeed_10m_max?.[i]?.toFixed(0) ?? '--'} km/h</div></div><div className="shrink-0 flex flex-col items-end gap-0.5"><div className="flex items-center gap-0.5 text-[8px] text-orange-400/70"><Sunrise size={8} />{formatTime(d.sunrise[i])}</div><div className="flex items-center gap-0.5 text-[8px] text-purple-400/70"><Sunset size={8} />{formatTime(d.sunset[i])}</div></div></div>; }) : isLoading ? Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-12 bg-neutral-800/40 rounded animate-pulse" />) : null}</div>}

      {tab === 'aqi' && <AQIPanel />}
      {tab === 'compare' && <ComparePanel />}
    </div>
  );
}
