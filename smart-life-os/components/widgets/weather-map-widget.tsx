"use client";

import { useEffect, useRef, useState } from "react";
import type { WeatherSnapshot } from "@/lib/types";

const layerLabels = ["Rain radar", "Wind", "PM2.5"];

export function WeatherMapWidget() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [activeLayers, setActiveLayers] = useState<string[]>(["Rain radar", "PM2.5"]);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      const response = await fetch("/api/weather?lat=13.7563&lon=100.5018&location=Bangkok");
      const data = (await response.json()) as WeatherSnapshot;
      if (!cancelled) setWeather(data);
    }

    void loadWeather();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    async function initMap() {
      const maplibregl = (await import("maplibre-gl")).default;
      if (!mapRef.current || disposed) return;

      const map = new maplibregl.Map({
        container: mapRef.current,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [100.5018, 13.7563],
        zoom: 9,
        attributionControl: false
      });

      new maplibregl.Marker({ color: "#38bdf8" }).setLngLat([100.5018, 13.7563]).addTo(map);
      cleanup = () => {
        map.remove();
      };
    }

    void initMap();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  const current = weather?.current;

  return (
    <div className="grid gap-4">
      <div className="h-64 overflow-hidden rounded-3xl border border-slate-700 bg-slate-950" ref={mapRef} />
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-2xl bg-slate-950/70 p-3">
          <p className="text-slate-400">Temp</p>
          <p className="mt-1 text-lg font-bold text-white">{current ? `${current.temperature}°C` : "--"}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/70 p-3">
          <p className="text-slate-400">Rain</p>
          <p className="mt-1 text-lg font-bold text-white">{current ? `${current.rain} mm` : "--"}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/70 p-3">
          <p className="text-slate-400">PM2.5</p>
          <p className="mt-1 text-lg font-bold text-white">{current ? current.pm25 : "--"}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {layerLabels.map((layer) => {
          const enabled = activeLayers.includes(layer);
          return (
            <button
              key={layer}
              type="button"
              onClick={() => setActiveLayers((layers) => (enabled ? layers.filter((item) => item !== layer) : [...layers, layer]))}
              className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                enabled ? "border-cyan-300 bg-cyan-300/10 text-cyan-100" : "border-slate-700 text-slate-400"
              }`}
            >
              {layer}
            </button>
          );
        })}
      </div>
      {weather?.alerts.map((alert) => (
        <p key={alert} className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
          {alert}
        </p>
      ))}
    </div>
  );
}
