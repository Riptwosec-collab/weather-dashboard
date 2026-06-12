import { CloudRain, Wind, Thermometer, Gauge, Waves, Sun, CloudLightning } from 'lucide-react';
import type { LayerDef, LayerId } from '../types';

// ── Temperature helpers ────────────────────────────────────
export const celsiusToF = (c: number): number => +(c * 9 / 5 + 32).toFixed(1);

export const formatTemp = (val: number | null | undefined, unit: 'C' | 'F'): string => {
  if (val == null) return '--';
  return unit === 'F' ? `${celsiusToF(val)}°F` : `${val}°C`;
};

// ── WMO weather codes ──────────────────────────────────────
export const WMO_CODES: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icing fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Showers', 81: 'Heavy showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Thunderstorm + heavy hail',
};

export const wmoLabel = (code: number | undefined): string =>
  code != null ? WMO_CODES[code] ?? `Code ${code}` : '--';

// ── Wind direction ─────────────────────────────────────────
const DIRECTIONS = ['N','NE','E','SE','S','SW','W','NW'];
export const windDir = (deg: number | undefined): string => {
  if (deg == null) return '--';
  return DIRECTIONS[Math.round(deg / 45) % 8];
};

// ── Layer definitions ──────────────────────────────────────
export const LAYERS_LIST: LayerDef[] = [
  { id: 'radar',    name: 'Rain Radar',      color: 'text-blue-400'   },
  { id: 'wind',     name: 'Wind Gusts',       color: 'text-teal-400'   },
  { id: 'temp',     name: 'Temperature',      color: 'text-red-400'    },
  { id: 'pressure', name: 'Pressure Isobars', color: 'text-purple-400' },
  { id: 'waves',    name: 'Swell & Waves',    color: 'text-cyan-400'   },
  { id: 'clouds',   name: 'Cloud Cover',      color: 'text-gray-400'   },
  { id: 'storms',   name: 'Thunderstorms',    color: 'text-yellow-400' },
];

export const LAYER_ICONS: Record<LayerId, React.ComponentType<{ size?: number; className?: string }>> = {
  radar:    CloudRain,
  wind:     Wind,
  temp:     Thermometer,
  pressure: Gauge,
  waves:    Waves,
  clouds:   Sun,
  storms:   CloudLightning,
};

// ── MapLibre tile overlay builder ─────────────────────────
interface TileSource {
  id: string;
  tiles: string[];
  tileSize?: number;
  attribution?: string;
}

interface TileLayer {
  id: string;
  source: string;
  paint: Record<string, unknown>;
}

export function buildOverlayLayers(
  activeLayers: LayerId[],
  rainviewerTs: number | null,
  owmKey = import.meta.env.VITE_OWM_API_KEY ?? 'demo'
): { sources: TileSource[]; layers: TileLayer[] } {
  const sources: TileSource[] = [];
  const layers: TileLayer[] = [];

  const push = (
    srcId: string,
    tiles: string[],
    layerId: string,
    paint: Record<string, unknown>,
    extra: Partial<TileSource> = {}
  ) => {
    sources.push({ id: srcId, tiles, tileSize: 256, ...extra });
    layers.push({ id: layerId, source: srcId, paint });
  };

  if (activeLayers.includes('radar') && rainviewerTs) {
    push(
      'rainviewer-src',
      [`https://tilecache.rainviewer.com/v2/radar/${rainviewerTs}/256/{z}/{x}/{y}/2/1_1.png`],
      'rainviewer-layer',
      { 'raster-opacity': 0.7 },
      { attribution: '© RainViewer' }
    );
  }

  if (activeLayers.includes('wind')) {
    push(
      'wind-src',
      [`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${owmKey}`],
      'wind-layer',
      { 'raster-opacity': 0.6, 'raster-hue-rotate': 200 }
    );
  }

  if (activeLayers.includes('temp')) {
    push(
      'temp-src',
      [`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${owmKey}`],
      'temp-layer',
      { 'raster-opacity': 0.6 }
    );
  }

  if (activeLayers.includes('clouds')) {
    push(
      'clouds-src',
      [`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${owmKey}`],
      'clouds-layer',
      { 'raster-opacity': 0.5 }
    );
  }

  if (activeLayers.includes('pressure')) {
    push(
      'pressure-src',
      [`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${owmKey}`],
      'pressure-layer',
      { 'raster-opacity': 0.5 }
    );
  }

  return { sources, layers };
}

// ── Sunrise/sunset formatter ───────────────────────────────
export const formatTime = (iso: string | undefined): string => {
  if (!iso) return '--';
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return '--'; }
};

// ── Date formatter for 7-day forecast ─────────────────────
export const formatDay = (iso: string | undefined): string => {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return '--'; }
};
