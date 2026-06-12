// ============================================================
// Open-Meteo API response types
// ============================================================

export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  precipitation: number[];
  precipitation_probability: number[];
  surface_pressure: number[];
  windspeed_10m: number[];
  winddirection_10m: number[];
  relative_humidity_2m: number[];
  uv_index: number[];
  weathercode: number[];
  cloudcover: number[];
}

export interface DailyWeather {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  weathercode: number[];
  sunrise: string[];
  sunset: string[];
  uv_index_max: number[];
  windspeed_10m_max: number[];
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: HourlyWeather;
  daily: DailyWeather;
  hourly_units?: Record<string, string>;
  daily_units?: Record<string, string>;
}

// ── Air quality ─────────────────────────────────────────────
export interface AirQualityData {
  hourly: {
    time: string[];
    pm10: number[];
    pm2_5: number[];
    carbon_monoxide: number[];
    nitrogen_dioxide: number[];
    ozone: number[];
    european_aqi: number[];
    us_aqi: number[];
  };
}

// ── Historical comparison ───────────────────────────────────
export interface HistoricalData {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
  };
}

// ── Geocoding ───────────────────────────────────────────────
export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  elevation?: number;
  population?: number;
}

// ── Store ────────────────────────────────────────────────────
export type TempUnit   = 'C' | 'F';
export type Theme      = 'dark' | 'light';
export type MobilePanel = 'layers' | 'analysis' | 'timeline';
export type LayerId    = 'radar' | 'wind' | 'temp' | 'pressure' | 'waves' | 'clouds' | 'storms';

export interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  addedAt: number;
}

export interface AlertThreshold {
  rain: number;
  wind: number;
  uv: number;
  aqi: number;
}

export interface CompareLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  weatherData: WeatherData | null;
}

export interface WeatherStore {
  activeLayers: LayerId[];
  rainviewerTs: number | null;

  selectedLocation: [number, number];
  locationName: string;
  savedLocations: SavedLocation[];

  // compare mode
  compareLocations: CompareLocation[];

  weatherData: WeatherData | null;
  airQualityData: AirQualityData | null;
  historicalData: HistoricalData | null;
  isLoading: boolean;
  error: string | null;

  currentTime: number;

  tempUnit: TempUnit;
  theme: Theme;
  mobilePanel: MobilePanel;
  showOnboarding: boolean;

  alertThresholds: AlertThreshold;
  dismissedAlerts: string[];
  pushEnabled: boolean;

  // actions
  toggleLayer: (id: LayerId) => void;
  setSelectedLocation: (lat: number, lng: number, name?: string) => void;
  setCurrentTime: (i: number) => void;
  toggleTempUnit: () => void;
  toggleTheme: () => void;
  setMobilePanel: (p: MobilePanel) => void;
  saveLocation: (loc: SavedLocation) => void;
  removeLocation: (id: string) => void;
  setAlertThreshold: (thresholds: Partial<AlertThreshold>) => void;
  dismissAlert: (key: string) => void;
  clearDismissedAlerts: () => void;
  dismissOnboarding: () => void;
  addCompareLocation: (loc: CompareLocation) => void;
  removeCompareLocation: (id: string) => void;
  setPushEnabled: (v: boolean) => void;

  // async
  fetchRainviewerTs: () => Promise<void>;
  fetchWeather: (lat: number, lng: number) => Promise<void>;
  fetchAirQuality: (lat: number, lng: number) => Promise<void>;
  fetchHistorical: (lat: number, lng: number) => Promise<void>;
  fetchCompareWeather: (locId: string, lat: number, lng: number) => Promise<void>;
}

// ── Layers ───────────────────────────────────────────────────
export interface LayerDef {
  id: LayerId;
  name: string;
  color: string;
}

// ── Charts ───────────────────────────────────────────────────
export interface HourlyChartPoint {
  time: string;
  temp: number;
  tempLY: number | null; // last year
  rain: number;
  prob: number;
}

export interface TimelineRow {
  time: string;
  temp: number;
  rain: number;
  prob: number;
  wind: number | string;
  hum: number | string;
  uv: number | string;
}

// ── AQI ─────────────────────────────────────────────────────
export interface AQILevel {
  label: string;
  color: string;
  bg: string;
  max: number;
}
