import React, { useState } from 'react';
import { AlertTriangle, X, Settings } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import { useWeather } from '../hooks/useWeather';

export default function AlertBanner() {
  const { alerts, dismissAlert } = useWeather();
  const { alertThresholds, setAlertThreshold } = useWeatherStore();
  const [showSettings, setShowSettings] = useState(false);

  if (alerts.length === 0 && !showSettings) return null;

  return (
    <div className="flex flex-col gap-1">
      {/* Active alerts */}
      {alerts.map((alert) => (
        <div
          key={alert.key}
          className={`flex items-start gap-2 rounded px-2 py-1.5 border text-[10px] ${
            alert.level === 'danger'
              ? 'bg-red-900/30 border-red-500/40 text-red-300'
              : 'bg-yellow-900/30 border-yellow-500/40 text-yellow-300'
          }`}
        >
          <AlertTriangle size={11} className="shrink-0 mt-0.5" />
          <span className="flex-1 leading-relaxed">{alert.message}</span>
          <button onClick={() => dismissAlert(alert.key)} className="shrink-0 opacity-60 hover:opacity-100">
            <X size={10} />
          </button>
        </div>
      ))}

      {/* Threshold settings toggle */}
      <button
        onClick={() => setShowSettings((v) => !v)}
        className="flex items-center gap-1 text-[9px] text-neutral-600 hover:text-neutral-400 transition-colors self-end"
      >
        <Settings size={9} />
        Alert thresholds
      </button>

      {/* Threshold editor */}
      {showSettings && (
        <div className="chart-panel flex flex-col gap-2 text-[10px]">
          <div className="text-[9px] text-neutral-500 uppercase tracking-wider">Alert when exceeds:</div>

          {/* Rain */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 w-16 shrink-0">Rain</span>
            <input
              type="range" min={1} max={50} step={1}
              value={alertThresholds.rain}
              onChange={(e) => setAlertThreshold({ rain: +e.target.value })}
              className="flex-1"
            />
            <span className="font-mono text-[color:var(--chart-rain)] w-14 text-right">{alertThresholds.rain} mm/h</span>
          </div>

          {/* Wind */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 w-16 shrink-0">Wind</span>
            <input
              type="range" min={10} max={120} step={5}
              value={alertThresholds.wind}
              onChange={(e) => setAlertThreshold({ wind: +e.target.value })}
              className="flex-1"
            />
            <span className="font-mono text-teal-300 w-14 text-right">{alertThresholds.wind} km/h</span>
          </div>

          {/* UV */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 w-16 shrink-0">UV Index</span>
            <input
              type="range" min={1} max={11} step={1}
              value={alertThresholds.uv}
              onChange={(e) => setAlertThreshold({ uv: +e.target.value })}
              className="flex-1"
            />
            <span className="font-mono text-yellow-300 w-14 text-right">≥ {alertThresholds.uv}</span>
          </div>
        </div>
      )}
    </div>
  );
}
