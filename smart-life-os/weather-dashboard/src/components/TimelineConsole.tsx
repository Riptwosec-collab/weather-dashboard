import React from 'react';
import { Clock, Thermometer, CloudRain, Wind, Droplets, Sun, Percent } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import { formatTemp, windDir } from '../utils/helpers';

const QUICK_STEPS = [
  { label: 'Now', index: 0 },
  { label: '+1h', index: 1 },
  { label: '+2h', index: 2 },
  { label: '+3h', index: 3 },
  { label: '+6h', index: 6 },
  { label: 'Tomorrow', index: 24 },
];

export default function TimelineConsole() {
  const { currentTime, setCurrentTime, weatherData, tempUnit } = useWeatherStore();
  const h = weatherData?.hourly;

  const rows = h
    ? h.time.slice(0, 36).map((t, i) => ({
        time: t.slice(11, 16),
        date: t.slice(0, 10),
        temp: h.temperature_2m[i],
        rain: h.precipitation[i],
        prob: h.precipitation_probability?.[i] ?? null,
        wind: h.windspeed_10m?.[i],
        dir:  h.winddirection_10m?.[i],
        hum:  h.relative_humidity_2m?.[i],
        uv:   h.uv_index?.[i],
      }))
    : [];

  if (rows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[10px] text-neutral-600">
        Select a location to load forecast timeline
      </div>
    );
  }

  const idx = Math.min(currentTime, rows.length - 1);
  const cur = rows[idx];

  return (
    <div className="flex flex-col flex-1 p-2 gap-2 h-full min-h-0 overflow-hidden">
      {/* Quick timeline buttons */}
      <div className="flex items-center gap-2 px-1 shrink-0">
        <Clock size={11} className="text-yellow-500 shrink-0" />
        <span className="font-mono text-yellow-400 text-[11px] w-12 shrink-0">
          {cur?.time ?? '00:00'}
        </span>
        <div className="flex gap-1 overflow-x-auto flex-1 pb-0.5">
          {QUICK_STEPS.map((step) => {
            const clamped = Math.min(step.index, rows.length - 1);
            const active = idx === clamped;
            return (
              <button
                key={step.label}
                onClick={() => setCurrentTime(clamped)}
                className={`px-2 py-1 rounded-full border text-[9px] whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-yellow-500/15 border-yellow-400/40 text-yellow-300'
                    : 'bg-black/30 border-white/10 text-neutral-500 hover:text-white hover:border-white/20'
                }`}
              >
                {step.label}
              </button>
            );
          })}
        </div>
        <input
          type="range" min={0} max={rows.length - 1} value={idx}
          onChange={(e) => setCurrentTime(+e.target.value)}
          className="w-36 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto min-h-0 bg-black/40 border border-white/5 rounded">
        <table className="w-full text-center text-[10px] border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-2 py-1.5 text-left text-[9px] text-neutral-500 font-normal w-20
                             sticky left-0 bg-neutral-950 border-r border-white/5 z-10">
                Param
              </th>
              {rows.slice(0, 18).map((r, i) => (
                <th key={i} onClick={() => setCurrentTime(i)}
                  className={`px-2 py-1.5 font-mono text-[9px] min-w-[52px] cursor-pointer
                              select-none transition-colors ${
                    idx === i ? 'text-yellow-400 bg-white/5' : 'text-neutral-600 hover:text-neutral-300'
                  }`}>
                  <div>{r.time}</div>
                  {i === 0 || r.time === '00:00' ? <div className="text-[7px] text-neutral-700">{r.date.slice(5)}</div> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5">
              <td className="px-2 py-1 text-left sticky left-0 bg-neutral-950 border-r border-white/5 z-10">
                <span className="flex items-center gap-1 text-neutral-500"><Thermometer size={9} />Temp</span>
              </td>
              {rows.slice(0, 18).map((r, i) => (
                <td key={i} className={`font-mono py-1 text-[9px] ${idx === i ? 'bg-white/5' : ''} ${
                  r.temp > 35 ? 'text-red-400' : r.temp > 30 ? 'text-orange-300' : r.temp > 20 ? 'text-neutral-300' : 'text-blue-300'
                }`}>
                  {formatTemp(r.temp, tempUnit)}
                </td>
              ))}
            </tr>

            <tr className="border-b border-white/5">
              <td className="px-2 py-1 text-left sticky left-0 bg-neutral-950 border-r border-white/5 z-10">
                <span className="flex items-center gap-1 text-neutral-500"><CloudRain size={9} />Rain</span>
              </td>
              {rows.slice(0, 18).map((r, i) => (
                <td key={i} className={`font-mono py-1 text-[9px] ${idx === i ? 'bg-white/5' : ''} ${
                  (r.rain ?? 0) > 10 ? 'text-blue-300' : (r.rain ?? 0) > 0 ? 'text-blue-500' : 'text-neutral-700'
                }`}>
                  {r.rain?.toFixed(1) ?? '--'}
                </td>
              ))}
            </tr>

            {rows.some((r) => r.prob != null) && (
              <tr className="border-b border-white/5">
                <td className="px-2 py-1 text-left sticky left-0 bg-neutral-950 border-r border-white/5 z-10">
                  <span className="flex items-center gap-1 text-neutral-500"><Percent size={9} />Prob</span>
                </td>
                {rows.slice(0, 18).map((r, i) => (
                  <td key={i} className={`font-mono py-1 text-[9px] ${idx === i ? 'bg-white/5' : ''} ${
                    (r.prob ?? 0) >= 70 ? 'text-purple-300' : (r.prob ?? 0) >= 40 ? 'text-purple-400' : 'text-neutral-600'
                  }`}>
                    {r.prob != null ? `${r.prob}%` : '--'}
                  </td>
                ))}
              </tr>
            )}

            <tr className="border-b border-white/5">
              <td className="px-2 py-1 text-left sticky left-0 bg-neutral-950 border-r border-white/5 z-10">
                <span className="flex items-center gap-1 text-neutral-500"><Wind size={9} />Wind</span>
              </td>
              {rows.slice(0, 18).map((r, i) => (
                <td key={i} className={`font-mono py-1 text-[9px] ${idx === i ? 'bg-white/5' : ''} ${
                  (r.wind ?? 0) > 50 ? 'text-red-400' : (r.wind ?? 0) > 30 ? 'text-teal-300' : 'text-neutral-400'
                }`}>
                  {r.wind != null ? `${r.wind} ${windDir(r.dir)}` : '--'}
                </td>
              ))}
            </tr>

            <tr className="border-b border-white/5">
              <td className="px-2 py-1 text-left sticky left-0 bg-neutral-950 border-r border-white/5 z-10">
                <span className="flex items-center gap-1 text-neutral-500"><Droplets size={9} />RH%</span>
              </td>
              {rows.slice(0, 18).map((r, i) => (
                <td key={i} className={`font-mono py-1 text-[9px] ${idx === i ? 'bg-white/5' : ''} ${
                  (r.hum ?? 0) >= 90 ? 'text-cyan-300' : 'text-cyan-500'
                }`}>
                  {r.hum ?? '--'}
                </td>
              ))}
            </tr>

            <tr>
              <td className="px-2 py-1 text-left sticky left-0 bg-neutral-950 border-r border-white/5 z-10">
                <span className="flex items-center gap-1 text-neutral-500"><Sun size={9} />UV</span>
              </td>
              {rows.slice(0, 18).map((r, i) => (
                <td key={i} className={`font-mono py-1 text-[9px] ${idx === i ? 'bg-white/5' : ''} ${
                  (r.uv ?? 0) >= 11 ? 'text-red-400' : (r.uv ?? 0) >= 8 ? 'text-orange-400'
                  : (r.uv ?? 0) >= 3 ? 'text-yellow-400' : 'text-neutral-600'
                }`}>
                  {r.uv?.toFixed(0) ?? '--'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
