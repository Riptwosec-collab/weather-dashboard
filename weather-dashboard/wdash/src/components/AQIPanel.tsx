import React, { useEffect } from 'react';
import { Wind, AlertCircle } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import type { AQILevel } from '../types';

// ── AQI level scale (European AQI) ──────────────────────────
const AQI_LEVELS: AQILevel[] = [
  { label: 'Good',        color: 'text-green-400',  bg: 'bg-green-900/30',  max: 20  },
  { label: 'Fair',        color: 'text-lime-400',   bg: 'bg-lime-900/30',   max: 40  },
  { label: 'Moderate',    color: 'text-yellow-400', bg: 'bg-yellow-900/30', max: 60  },
  { label: 'Poor',        color: 'text-orange-400', bg: 'bg-orange-900/30', max: 80  },
  { label: 'Very Poor',   color: 'text-red-400',    bg: 'bg-red-900/30',    max: 100 },
  { label: 'Hazardous',   color: 'text-purple-400', bg: 'bg-purple-900/30', max: Infinity },
];

function getLevel(aqi: number): AQILevel {
  return AQI_LEVELS.find((l) => aqi <= l.max) ?? AQI_LEVELS[AQI_LEVELS.length - 1];
}

// ── Gauge bar ────────────────────────────────────────────────
function GaugeBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color.replace('text-', 'bg-')}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Pollutant row ─────────────────────────────────────────────
function PollutantRow({
  label, value, unit, max, color,
}: {
  label: string; value: number | undefined; unit: string; max: number; color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-neutral-500 w-10 shrink-0">{label}</span>
      <GaugeBar value={value ?? 0} max={max} color={color} />
      <span className={`text-[9px] font-mono w-14 text-right shrink-0 ${color}`}>
        {value != null ? `${value.toFixed(0)} ${unit}` : '--'}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function AQIPanel() {
  const { selectedLocation, airQualityData, fetchAirQuality } = useWeatherStore();
  const [lat, lng] = selectedLocation;

  useEffect(() => {
    const timer = setTimeout(() => fetchAirQuality(lat, lng), 1000);
    return () => clearTimeout(timer);
  }, [lat, lng, fetchAirQuality]);

  const aq = airQualityData?.hourly;
  const aqiVal = aq?.european_aqi?.[0];
  const level  = aqiVal != null ? getLevel(aqiVal) : null;

  return (
    <div className="bg-black/50 border border-white/10 rounded p-2 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[9px] text-neutral-500 uppercase tracking-wider">
          <Wind size={9} />
          Air Quality Index
        </div>
        {level && (
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${level.color} ${level.bg}`}>
            {level.label}
          </span>
        )}
      </div>

      {/* Main AQI score */}
      <div className="flex items-end gap-3">
        <div className="flex flex-col">
          <span className="text-[9px] text-neutral-500">European AQI</span>
          <span className={`text-2xl font-mono font-bold leading-none ${level?.color ?? 'text-neutral-400'}`}>
            {aqiVal?.toFixed(0) ?? '--'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-neutral-500">US AQI</span>
          <span className="text-lg font-mono text-neutral-300 leading-none">
            {aq?.us_aqi?.[0]?.toFixed(0) ?? '--'}
          </span>
        </div>
      </div>

      {/* AQI scale bar */}
      <div className="flex gap-0.5 h-1.5">
        {AQI_LEVELS.filter((l) => l.max !== Infinity).map((l) => (
          <div
            key={l.label}
            className={`flex-1 rounded-full opacity-40 ${l.color.replace('text-', 'bg-')}`}
          />
        ))}
        <div className="flex-1 rounded-full bg-purple-400 opacity-40" />
      </div>
      {level && aqiVal != null && (
        <div
          className={`text-[8px] ${level.color} text-center`}
          style={{ marginTop: -6 }}
        >
          {level.label} ({aqiVal.toFixed(0)})
        </div>
      )}

      {/* Pollutant breakdown */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-white/5">
        <PollutantRow label="PM2.5" value={aq?.pm2_5?.[0]}          unit="μg/m³" max={75}  color="text-orange-400" />
        <PollutantRow label="PM10"  value={aq?.pm10?.[0]}           unit="μg/m³" max={150} color="text-yellow-400" />
        <PollutantRow label="O₃"   value={aq?.ozone?.[0]}           unit="μg/m³" max={180} color="text-blue-400" />
        <PollutantRow label="NO₂"  value={aq?.nitrogen_dioxide?.[0]} unit="μg/m³" max={200} color="text-red-400" />
        <PollutantRow label="CO"   value={aq?.carbon_monoxide?.[0] != null
          ? aq!.carbon_monoxide[0] / 1000 : undefined}               unit="mg/m³" max={15}  color="text-neutral-400" />
      </div>

      {!aq && (
        <div className="flex items-center gap-1.5 text-[9px] text-neutral-600">
          <AlertCircle size={9} />
          Loading air quality data…
        </div>
      )}
    </div>
  );
}
