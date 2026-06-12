import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  WeatherStore, WeatherData, AirQualityData, HistoricalData,
  LayerId, SavedLocation, AlertThreshold, MobilePanel,
  TempUnit, Theme, CompareLocation,
} from '../types';

// ── constants ───────────────────────────────────────────────
export const CACHE_TIME     = 15 * 60 * 1000; // 15 min
export const AQI_CACHE_TIME = 30 * 60 * 1000; // 30 min

const DEFAULT_THRESHOLDS: AlertThreshold = {
  rain: 10, wind: 50, uv: 8, aqi: 100,
};

// ── cache helpers ────────────────────────────────────────────
function readCache<T>(key: string, maxAge: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < maxAge) return data as T;
    localStorage.removeItem(key);
  } catch { /* ignore */ }
  return null;
}

function writeCache(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota exceeded */ }
}

const wKey   = (lat: number, lng: number) => `wdata_${lat.toFixed(2)}_${lng.toFixed(2)}`;
const aqiKey = (lat: number, lng: number) => `aqi_${lat.toFixed(2)}_${lng.toFixed(2)}`;
const histKey = (lat: number, lng: number, year: number) =>
  `hist_${lat.toFixed(2)}_${lng.toFixed(2)}_${year}`;

const clickedPointName = (lat: number, lng: number) =>
  `Selected Point ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

const nextLocationName = (lat: number, lng: number, name?: string) => {
  const trimmed = name?.trim();
  return trimmed || clickedPointName(lat, lng);
};

type RainViewerFrame = {
  time?: number;
  path?: string;
};

const latestRainViewerPath = (frames: RainViewerFrame[] | undefined, fallbackType: 'radar' | 'satellite') => {
  const latest = frames?.slice(-1)[0];
  if (!latest) return undefined;
  if (latest.path) return latest.path;
  return latest.time ? `/v2/${fallbackType}/${latest.time}` : undefined;
};

const removeUnavailableRainViewerLayers = (
  layers: LayerId[],
  hasRadar: boolean,
  hasSatellite: boolean,
): LayerId[] => layers.filter((layer) => {
  if ((layer === 'radar' || layer === 'storms') && !hasRadar) return false;
  if (layer === 'satellite' && !hasSatellite) return false;
  return true;
});

// ── store ────────────────────────────────────────────────────
export const useWeatherStore = create<WeatherStore>()(
  persist(
    (set) => ({
      // state
      activeLayers: ['radar'] as LayerId[],
      rainviewerTs: null,
      satelliteTs: null,

      selectedLocation: [13.7563, 100.5018] as [number, number],
      locationName: 'Bangkok',
      savedLocations: [] as SavedLocation[],
      compareLocations: [] as CompareLocation[],

      weatherData: null,
      airQualityData: null,
      historicalData: null,
      isLoading: false,
      error: null,

      currentTime: 0,

      tempUnit: 'C' as TempUnit,
      theme: 'dark' as Theme,
      mobilePanel: 'layers' as MobilePanel,
      showOnboarding: true,

      alertThresholds: DEFAULT_THRESHOLDS,
      dismissedAlerts: [] as string[],
      pushEnabled: false,

      // ── sync actions ────────────────────────────────────
      toggleLayer: (id) =>
        set((s) => {
          const hasRadar = Boolean(s.rainviewerTs);
          const hasSatellite = Boolean(s.satelliteTs);

          if ((id === 'radar' || id === 'storms') && !hasRadar) {
            return {
              activeLayers: removeUnavailableRainViewerLayers(s.activeLayers, hasRadar, hasSatellite),
            };
          }

          if (id === 'satellite' && !hasSatellite) {
            return {
              activeLayers: removeUnavailableRainViewerLayers(s.activeLayers, hasRadar, hasSatellite),
            };
          }

          return {
            activeLayers: s.activeLayers.includes(id)
              ? s.activeLayers.filter((l) => l !== id)
              : [...s.activeLayers, id],
          };
        }),

      setSelectedLocation: (lat, lng, name) =>
        set({
          selectedLocation: [lat, lng],
          locationName: nextLocationName(lat, lng, name),
          currentTime: 0,
        }),

      setCurrentTime: (i) => set({ currentTime: i }),

      toggleTempUnit: () =>
        set((s) => ({ tempUnit: s.tempUnit === 'C' ? 'F' : 'C' })),

      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      setMobilePanel: (p) => set({ mobilePanel: p }),

      saveLocation: (loc) =>
        set((s) => {
          if (s.savedLocations.find((l) => l.id === loc.id)) return s;
          return { savedLocations: [loc, ...s.savedLocations].slice(0, 5) };
        }),

      removeLocation: (id) =>
        set((s) => ({ savedLocations: s.savedLocations.filter((l) => l.id !== id) })),

      setAlertThreshold: (t) =>
        set((s) => ({ alertThresholds: { ...s.alertThresholds, ...t } })),

      dismissAlert: (key) =>
        set((s) => ({ dismissedAlerts: [...s.dismissedAlerts, key] })),

      clearDismissedAlerts: () => set({ dismissedAlerts: [] }),

      dismissOnboarding: () => set({ showOnboarding: false }),

      addCompareLocation: (loc) =>
        set((s) => {
          if (s.compareLocations.find((l) => l.id === loc.id)) return s;
          return { compareLocations: [...s.compareLocations, loc].slice(0, 3) };
        }),

      removeCompareLocation: (id) =>
        set((s) => ({ compareLocations: s.compareLocations.filter((l) => l.id !== id) })),

      setPushEnabled: (v) => set({ pushEnabled: v }),

      // ── async: RainViewer frame paths ─────────────────────
      fetchRainviewerTs: async () => {
        try {
          const res  = await fetch('https://api.rainviewer.com/public/weather-maps.json');
          const json = await res.json();
          const radarPath = latestRainViewerPath(json.radar?.past, 'radar');
          const satPath   = latestRainViewerPath(json.satellite?.infrared, 'satellite');
          set((s) => ({
            rainviewerTs: radarPath ?? null,
            satelliteTs: satPath ?? null,
            activeLayers: removeUnavailableRainViewerLayers(
              s.activeLayers,
              Boolean(radarPath),
              Boolean(satPath),
            ),
          }));
        } catch {
          set((s) => ({
            rainviewerTs: null,
            satelliteTs: null,
            activeLayers: removeUnavailableRainViewerLayers(s.activeLayers, false, false),
          }));
        }
      },

      // ── async: weather ───────────────────────────────────
      fetchWeather: async (lat, lng) => {
        const cached = readCache<WeatherData>(wKey(lat, lng), CACHE_TIME);
        if (cached) { set({ weatherData: cached, isLoading: false, error: null }); return; }

        set({ isLoading: true, error: null });
        try {
          const hourly = [
            'temperature_2m', 'precipitation', 'precipitation_probability',
            'surface_pressure', 'windspeed_10m', 'winddirection_10m',
            'relative_humidity_2m', 'uv_index', 'weathercode', 'cloudcover',
          ].join(',');

          const daily = [
            'temperature_2m_max', 'temperature_2m_min',
            'precipitation_sum', 'precipitation_probability_max',
            'weathercode', 'sunrise', 'sunset',
            'uv_index_max', 'windspeed_10m_max',
          ].join(',');

          const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${lat}&longitude=${lng}` +
            `&hourly=${hourly}&daily=${daily}` +
            `&forecast_days=7&timezone=auto`;

          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: WeatherData = await res.json();
          writeCache(wKey(lat, lng), data);
          set({ weatherData: data, isLoading: false, error: null });
        } catch (err) {
          set({ isLoading: false, error: `Failed to load weather: ${err instanceof Error ? err.message : 'Unknown'}` });
        }
      },

      // ── async: AQI ───────────────────────────────────────
      fetchAirQuality: async (lat, lng) => {
        const cached = readCache<AirQualityData>(aqiKey(lat, lng), AQI_CACHE_TIME);
        if (cached) { set({ airQualityData: cached }); return; }

        try {
          const url =
            `https://air-quality-api.open-meteo.com/v1/air-quality` +
            `?latitude=${lat}&longitude=${lng}` +
            `&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,european_aqi,us_aqi` +
            `&timezone=auto&forecast_days=1`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: AirQualityData = await res.json();
          writeCache(aqiKey(lat, lng), data);
          set({ airQualityData: data });
        } catch { /* AQI is optional — silent fail */ }
      },

      // ── async: historical (same day last year) ───────────
      fetchHistorical: async (lat, lng) => {
        const now       = new Date();
        const lastYear  = now.getFullYear() - 1;
        const cached    = readCache<HistoricalData>(histKey(lat, lng, lastYear), 24 * 60 * 60 * 1000);
        if (cached) { set({ historicalData: cached }); return; }

        try {
          const pad = (n: number) => String(n).padStart(2, '0');
          const startDate = `${lastYear}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
          const url =
            `https://archive-api.open-meteo.com/v1/archive` +
            `?latitude=${lat}&longitude=${lng}` +
            `&start_date=${startDate}&end_date=${startDate}` +
            `&hourly=temperature_2m,precipitation&timezone=auto`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: HistoricalData = await res.json();
          writeCache(histKey(lat, lng), data);
          set({ historicalData: data });
        } catch { /* historical is optional */ }
      },

      // ── async: compare location weather ─────────────────
      fetchCompareWeather: async (locId, lat, lng) => {
        try {
          const cached = readCache<WeatherData>(wKey(lat, lng), CACHE_TIME);
          const data: WeatherData = cached ?? await (async () => {
            const hourly = [
              'temperature_2m', 'precipitation', 'precipitation_probability',
              'windspeed_10m', 'relative_humidity_2m', 'uv_index', 'weathercode',
            ].join(',');
            const daily = [
              'temperature_2m_max', 'temperature_2m_min',
              'precipitation_sum', 'weathercode', 'uv_index_max',
            ].join(',');
            const url =
              `https://api.open-meteo.com/v1/forecast` +
              `?latitude=${lat}&longitude=${lng}` +
              `&hourly=${hourly}&daily=${daily}&forecast_days=7&timezone=auto`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const d: WeatherData = await res.json();
            writeCache(wKey(lat, lng), d);
            return d;
          })();

          set((s) => ({
            compareLocations: s.compareLocations.map((l) =>
              l.id === locId ? { ...l, weatherData: data } : l
            ),
          }));
        } catch { /* silent — compare is optional */ }
      },
    }),
    {
      name: 'weather-dashboard-prefs',
      partialize: (s) => ({
        tempUnit:        s.tempUnit,
        theme:           s.theme,
        savedLocations:  s.savedLocations,
        alertThresholds: s.alertThresholds,
        activeLayers:    s.activeLayers,
        selectedLocation: s.selectedLocation,
        locationName:    s.locationName,
        showOnboarding:  s.showOnboarding,
        pushEnabled:     s.pushEnabled,
      }),
    }
  )
);
