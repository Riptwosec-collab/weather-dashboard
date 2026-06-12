import { CloudRain, Wind, Thermometer, Gauge, Waves, Sun, CloudLightning } from 'lucide-react';
import type { LayerDef, LayerId } from '../types';

export const OWM_API_KEY = import.meta.env.VITE_OWM_API_KEY as string | undefined;
export const hasOwmApiKey = Boolean(OWM_API_KEY && OWM_API_KEY.trim() && OWM_API_KEY !== 'demo');

const OWM_NATIVE_MAX_ZOOM = 5;
const RAINVIEWER_RADAR_MAX_ZOOM = 10;
// RainViewer satellite tiles are low-zoom global imagery. Requesting higher native zooms
// returns provider error tiles that say "Zoom Level Not Supported".
const RAINVIEWER_SATELLITE_MAX_ZOOM = 5;
const OWM_ATTRIBUTION = 'OpenWeatherMap';
const RAINVIEWER_ATTRIBUTION = 'RainViewer';

export const celsiusToF = (c: number): number => +(c * 9 / 5 + 32).toFixed(1);

export const formatTemp = (val: number | null | undefined, unit: 'C' | 'F'): string => {
  if (val == null) return '--';
  return unit === 'F' ? `${celsiusToF(val)}°F` : `${val}°C`;
};

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

const DIRECTIONS = ['N','NE','E','SE','S','SW','W','NW'];
export const windDir = (deg: number | undefined): string => {
  if (deg == null) return '--';
  return DIRECTIONS[Math.round(deg / 45) % 8];
};

export const LAYERS_LIST: LayerDef[] = [
  { id: 'radar',     name: 'Rain Radar',       color: 'text-blue-400'   },
  { id: 'satellite', name: 'Satellite Clouds', color: 'text-sky-300'    },
  { id: 'wind',      name: 'Wind Gusts',        color: 'text-teal-400'   },
  { id: 'temp',      name: 'Temperature',       color: 'text-red-400'    },
  { id: 'pressure',  name: 'Pressure Isobars',  color: 'text-purple-400' },
  { id: 'precip',    name: 'Precipitation',     color: 'text-blue-300'   },
  { id: 'clouds',    name: 'Cloud Cover',       color: 'text-gray-400'   },
  { id: 'storms',    name: 'Storm Radar',       color: 'text-yellow-400' },
  { id: 'waves',     name: 'Swell & Waves',     color: 'text-cyan-400'   },
];

export const LAYER_ICONS: Record<LayerId, React.ComponentType<{ size?: number; className?: string }>> = {
  radar:     CloudRain,
  satellite: Sun,
  wind:      Wind,
  temp:      Thermometer,
  pressure:  Gauge,
  precip:    CloudRain,
  waves:     Waves,
  clouds:    Sun,
  storms:    CloudLightning,
};

interface TileSource {
  id: string;
  tiles: string[];
  tileSize?: number;
  minzoom?: number;
  maxzoom?: number;
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
  satelliteTs: number | null,
  owmKey = OWM_API_KEY
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
      'rainviewer-radar-src',
      [`https://tilecache.rainviewer.com/v2/radar/${rainviewerTs}/256/{z}/{x}/{y}/2/1_1.png`],
      'rainviewer-radar-layer',
      { 'raster-opacity': 0.72, 'raster-contrast': 0.08, 'raster-saturation': 0.2, 'raster-resampling': 'linear' },
      { attribution: RAINVIEWER_ATTRIBUTION, minzoom: 0, maxzoom: RAINVIEWER_RADAR_MAX_ZOOM }
    );
  }

  if (activeLayers.includes('storms') && rainviewerTs) {
    push(
      'rainviewer-storm-src',
      [`https://tilecache.rainviewer.com/v2/radar/${rainviewerTs}/256/{z}/{x}/{y}/4/1_1.png`],
      'rainviewer-storm-layer',
      { 'raster-opacity': 0.8, 'raster-contrast': 0.18, 'raster-saturation': 0.35, 'raster-resampling': 'linear' },
      { attribution: RAINVIEWER_ATTRIBUTION, minzoom: 0, maxzoom: RAINVIEWER_RADAR_MAX_ZOOM }
    );
  }

  if (activeLayers.includes('satellite') && satelliteTs) {
    push(
      'rainviewer-satellite-src',
      [`https://tilecache.rainviewer.com/v2/satellite/${satelliteTs}/256/{z}/{x}/{y}/0/0_0.png`],
      'rainviewer-satellite-layer',
      { 'raster-opacity': 0.45, 'raster-contrast': 0.08, 'raster-saturation': -0.2, 'raster-resampling': 'linear' },
      { attribution: RAINVIEWER_ATTRIBUTION, minzoom: 0, maxzoom: RAINVIEWER_SATELLITE_MAX_ZOOM }
    );
  }

  if (!owmKey || owmKey === 'demo') return { sources, layers };

  const owmSourceOptions: Partial<TileSource> = {
    attribution: OWM_ATTRIBUTION,
    minzoom: 0,
    maxzoom: OWM_NATIVE_MAX_ZOOM,
  };

  if (activeLayers.includes('wind')) {
    push('wind-src', [`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${owmKey}`], 'wind-layer', { 'raster-opacity': 0.58, 'raster-hue-rotate': 200, 'raster-saturation': 0.2, 'raster-resampling': 'linear' }, owmSourceOptions);
  }

  if (activeLayers.includes('temp')) {
    push('temp-src', [`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${owmKey}`], 'temp-layer', { 'raster-opacity': 0.62, 'raster-contrast': 0.08, 'raster-resampling': 'linear' }, owmSourceOptions);
  }

  if (activeLayers.includes('precip')) {
    push('precip-src', [`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${owmKey}`], 'precip-layer', { 'raster-opacity': 0.68, 'raster-contrast': 0.12, 'raster-saturation': 0.2, 'raster-resampling': 'linear' }, owmSourceOptions);
  }

  if (activeLayers.includes('clouds')) {
    push('clouds-src', [`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${owmKey}`], 'clouds-layer', { 'raster-opacity': 0.46, 'raster-contrast': 0.06, 'raster-resampling': 'linear' }, owmSourceOptions);
  }

  if (activeLayers.includes('pressure')) {
    push('pressure-src', [`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${owmKey}`], 'pressure-layer', { 'raster-opacity': 0.5, 'raster-contrast': 0.08, 'raster-resampling': 'linear' }, owmSourceOptions);
  }

  return { sources, layers };
}

export const formatTime = (iso: string | undefined): string => {
  if (!iso) return '--';
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return '--'; }
};

export const formatDay = (iso: string | undefined): string => {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return '--'; }
};
