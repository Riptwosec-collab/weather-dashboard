import { CloudRain, Wind, Thermometer, Gauge, Waves, Sun, CloudLightning, Map as MapIcon } from 'lucide-react';
import type { LayerDef, LayerId } from '../types';

export const OWM_API_KEY = import.meta.env.VITE_OWM_API_KEY as string | undefined;
export const hasOwmApiKey = Boolean(OWM_API_KEY && OWM_API_KEY.trim() && OWM_API_KEY !== 'demo');

const OWM_NATIVE_MAX_ZOOM = 5;
// RainViewer can return black "Zoom Level Not Supported" image tiles at city-level native zooms.
// Keep the requested native tile zoom low and let MapLibre overzoom/stretch those tiles instead.
const RAINVIEWER_RADAR_MAX_ZOOM = 5;
// RainViewer satellite tiles are low-zoom global imagery. Requesting higher native zooms
// returns provider error tiles that say "Zoom Level Not Supported".
const RAINVIEWER_SATELLITE_MAX_ZOOM = 5;
const OWM_ATTRIBUTION = 'OpenWeatherMap';
const RAINVIEWER_ATTRIBUTION = 'RainViewer';
const RAINVIEWER_HOST = 'https://tilecache.rainviewer.com';

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

export const clickedLocationLabel = (lat: number, lng: number) =>
  `Selected Point ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

interface ReverseGeocodeResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  localityInfo?: {
    administrative?: Array<{ name?: string; adminLevel?: number }>;
  };
}

export async function reverseGeocodeName(lat: number, lng: number): Promise<string> {
  const fallback = clickedLocationLabel(lat, lng);

  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('localityLanguage', 'en');

    const res = await fetch(url.toString(), { signal: controller.signal });
    window.clearTimeout(timeout);
    if (!res.ok) return fallback;

    const data = await res.json() as ReverseGeocodeResponse;
    const adminName = data.localityInfo?.administrative
      ?.find((item) => item.adminLevel === 8 || item.adminLevel === 6 || item.adminLevel === 4)
      ?.name;

    const parts = [
      data.city || data.locality || adminName,
      data.principalSubdivision,
      data.countryName,
    ].filter((part, index, arr): part is string => Boolean(part && arr.indexOf(part) === index));

    return parts.length ? parts.join(', ') : fallback;
  } catch {
    return fallback;
  }
}

export const LAYERS_LIST: LayerDef[] = [
  { id: 'admin',     name: 'Admin Boundaries', color: 'text-cyan-300'   },
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
  admin:     MapIcon,
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

const cleanRainViewerPath = (path: string) => path.startsWith('/') ? path : `/${path}`;
const rainViewerTileUrl = (path: string, colorScheme: number, options = '1_1') =>
  `${RAINVIEWER_HOST}${cleanRainViewerPath(path)}/256/{z}/{x}/{y}/${colorScheme}/${options}.png`;

export function buildOverlayLayers(
  activeLayers: LayerId[],
  rainviewerTs: string | null,
  satelliteTs: string | null,
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
      [rainViewerTileUrl(rainviewerTs, 2, '1_1')],
      'rainviewer-radar-layer',
      { 'raster-opacity': 0.68, 'raster-contrast': 0.02, 'raster-saturation': 0.12, 'raster-brightness-max': 0.92, 'raster-resampling': 'linear' },
      { attribution: RAINVIEWER_ATTRIBUTION, minzoom: 0, maxzoom: RAINVIEWER_RADAR_MAX_ZOOM }
    );
  }

  if (activeLayers.includes('storms') && rainviewerTs) {
    push(
      'rainviewer-storm-src',
      [rainViewerTileUrl(rainviewerTs, 4, '1_1')],
      'rainviewer-storm-layer',
      { 'raster-opacity': 0.72, 'raster-contrast': 0.08, 'raster-saturation': 0.22, 'raster-brightness-max': 0.94, 'raster-resampling': 'linear' },
      { attribution: RAINVIEWER_ATTRIBUTION, minzoom: 0, maxzoom: RAINVIEWER_RADAR_MAX_ZOOM }
    );
  }

  if (activeLayers.includes('satellite') && satelliteTs) {
    push(
      'rainviewer-satellite-src',
      [rainViewerTileUrl(satelliteTs, 0, '0_0')],
      'rainviewer-satellite-layer',
      { 'raster-opacity': 0.36, 'raster-contrast': -0.08, 'raster-saturation': -0.16, 'raster-brightness-max': 0.86, 'raster-resampling': 'linear' },
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
    push('wind-src', [`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${owmKey}`], 'wind-layer', { 'raster-opacity': 0.46, 'raster-hue-rotate': 200, 'raster-saturation': 0.08, 'raster-brightness-max': 0.92, 'raster-resampling': 'linear' }, owmSourceOptions);
  }

  if (activeLayers.includes('temp')) {
    push('temp-src', [`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${owmKey}`], 'temp-layer', { 'raster-opacity': 0.48, 'raster-contrast': -0.02, 'raster-brightness-max': 0.90, 'raster-resampling': 'linear' }, owmSourceOptions);
  }

  if (activeLayers.includes('precip')) {
    push('precip-src', [`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${owmKey}`], 'precip-layer', { 'raster-opacity': 0.50, 'raster-contrast': -0.04, 'raster-saturation': 0.02, 'raster-brightness-max': 0.88, 'raster-resampling': 'linear' }, owmSourceOptions);
  }

  if (activeLayers.includes('clouds')) {
    push('clouds-src', [`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${owmKey}`], 'clouds-layer', { 'raster-opacity': 0.30, 'raster-contrast': -0.12, 'raster-saturation': -0.18, 'raster-brightness-max': 0.78, 'raster-resampling': 'linear' }, owmSourceOptions);
  }

  if (activeLayers.includes('pressure')) {
    push('pressure-src', [`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${owmKey}`], 'pressure-layer', { 'raster-opacity': 0.42, 'raster-contrast': -0.02, 'raster-brightness-max': 0.90, 'raster-resampling': 'linear' }, owmSourceOptions);
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
  } catch {
    return '--';
  }
};
