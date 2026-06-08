import React, { useState, useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  CloudRain, Wind, Thermometer, Gauge, Waves,
  CloudLightning, Sun, Search, X, AlertTriangle,
  Droplets, Eye, Layers, TrendingUp, Clock,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ==========================================
// 1. CONSTANTS & HELPERS
// ==========================================
const CACHE_TIME = 15 * 60 * 1000; // 15 min

// WMO weather code → human label
const WMO_CODES = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icing fog', 51: 'Light drizzle', 53: 'Drizzle',
  55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Showers',
  81: 'Heavy showers', 82: 'Violent showers', 95: 'Thunderstorm',
  96: 'Thunderstorm + hail', 99: 'Thunderstorm + heavy hail',
};

const celsiusToF = (c) => +(c * 9 / 5 + 32).toFixed(1);
const formatTemp = (val, unit) =>
  val == null ? '--' : unit === 'F' ? `${celsiusToF(val)}°F` : `${val}°C`;

// RainViewer tile timestamp list (refreshes every 10 min on their end)
const RAINVIEWER_URL = 'https://tilecache.rainviewer.com/v2/radar/nowcast';

// ==========================================
// 2. ZUSTAND STORE
// ==========================================
const useWeatherStore = create((set, get) => ({
  // map layers
  activeLayers: ['radar'],
  rainviewerTs: null,           // latest RainViewer timestamp

  // location
  selectedLocation: [13.7563, 100.5018], // BKK default
  locationName: 'Bangkok',

  // weather data
  weatherData: null,
  isLoading: false,
  error: null,

  // timeline
  currentTime: 0,

  // preferences
  tempUnit: 'C',                // 'C' | 'F'
  mobilePanel: 'layers',        // 'layers' | 'analysis' | 'timeline'

  // ---- actions ----
  toggleLayer: (id) =>
    set((s) => ({
      activeLayers: s.activeLayers.includes(id)
        ? s.activeLayers.filter((l) => l !== id)
        : [...s.activeLayers, id],
    })),

  setSelectedLocation: (lat, lng, name = null) =>
    set({ selectedLocation: [lat, lng], ...(name ? { locationName: name } : {}) }),

  setCurrentTime: (i) => set({ currentTime: i }),
  toggleTempUnit: () =>
    set((s) => ({ tempUnit: s.tempUnit === 'C' ? 'F' : 'C' })),
  setMobilePanel: (p) => set({ mobilePanel: p }),

  // fetch RainViewer latest timestamp
  fetchRainviewerTs: async () => {
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const json = await res.json();
      const ts = json.radar?.past?.slice(-1)[0]?.time;
      if (ts) set({ rainviewerTs: ts });
    } catch {
      // silently ignore – map still works without live radar
    }
  },

  // fetch weather from Open-Meteo
  fetchWeather: async (lat, lng) => {
    const cacheKey = `wdata_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TIME) {
          set({ weatherData: data, isLoading: false, error: null });
          return;
        }
      }
    } catch {
      localStorage.removeItem(cacheKey);
    }

    set({ isLoading: true, error: null });
    try {
      const params = [
        'temperature_2m',
        'precipitation',
        'surface_pressure',
        'windspeed_10m',
        'winddirection_10m',
        'relative_humidity_2m',
        'uv_index',
        'weathercode',
        'cloudcover',
      ].join(',');

      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lng}` +
        `&hourly=${params}` +
        `&forecast_days=2` +
        `&timezone=auto`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
      } catch {
        // ignore quota errors
      }

      set({ weatherData: data, isLoading: false, error: null });
    } catch (err) {
      console.error('fetchWeather:', err);
      set({ isLoading: false, error: err.message || 'Failed to fetch weather data' });
    }
  },
}));

// ==========================================
// 3. LAYER DEFINITIONS & TILE SOURCES
// ==========================================
const layersList = [
  { id: 'radar',    name: 'Rain Radar',       icon: CloudRain,      color: 'text-blue-400'   },
  { id: 'wind',     name: 'Wind Gusts',        icon: Wind,           color: 'text-teal-400'   },
  { id: 'temp',     name: 'Temperature',       icon: Thermometer,    color: 'text-red-400'    },
  { id: 'pressure', name: 'Pressure Isobars',  icon: Gauge,          color: 'text-purple-400' },
  { id: 'waves',    name: 'Swell & Waves',     icon: Waves,          color: 'text-cyan-400'   },
  { id: 'clouds',   name: 'Cloud Cover',       icon: Sun,            color: 'text-gray-400'   },
  { id: 'storms',   name: 'Thunderstorms',     icon: CloudLightning, color: 'text-yellow-400' },
];

// Build MapLibre raster sources/layers for each overlay
function buildOverlayLayers(activeLayers, rainviewerTs) {
  const sources = [];
  const layers = [];

  if (activeLayers.includes('radar') && rainviewerTs) {
    sources.push({
      id: 'rainviewer-src',
      type: 'raster',
      tiles: [
        `https://tilecache.rainviewer.com/v2/radar/${rainviewerTs}/256/{z}/{x}/{y}/2/1_1.png`,
      ],
      tileSize: 256,
      attribution: '© RainViewer',
    });
    layers.push({
      id: 'rainviewer-layer',
      type: 'raster',
      source: 'rainviewer-src',
      paint: { 'raster-opacity': 0.7 },
    });
  }

  if (activeLayers.includes('wind')) {
    // Open-Meteo wind via open-source Pirate Weather / NOAA tileserver (free, no key)
    sources.push({
      id: 'wind-src',
      type: 'raster',
      tiles: [
        `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=demo`,
      ],
      tileSize: 256,
    });
    layers.push({
      id: 'wind-layer',
      type: 'raster',
      source: 'wind-src',
      paint: { 'raster-opacity': 0.55, 'raster-hue-rotate': 200 },
    });
  }

  if (activeLayers.includes('temp')) {
    sources.push({
      id: 'temp-src',
      type: 'raster',
      tiles: [
        `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=demo`,
      ],
      tileSize: 256,
    });
    layers.push({
      id: 'temp-layer',
      type: 'raster',
      source: 'temp-src',
      paint: { 'raster-opacity': 0.6 },
    });
  }

  if (activeLayers.includes('clouds')) {
    sources.push({
      id: 'clouds-src',
      type: 'raster',
      tiles: [
        `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=demo`,
      ],
      tileSize: 256,
    });
    layers.push({
      id: 'clouds-layer',
      type: 'raster',
      source: 'clouds-src',
      paint: { 'raster-opacity': 0.5 },
    });
  }

  return { sources, layers };
}

// ==========================================
// 4. CITY SEARCH COMPONENT
// ==========================================
function CitySearch() {
  const { setSelectedLocation } = useWeatherStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback((q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`
        );
        const json = await res.json();
        setResults(json.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  return (
    <div className="relative">
      {/* Input */}
      <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded px-2 py-1.5">
        <Search size={12} className="text-neutral-500 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
          placeholder="Search city…"
          className="flex-1 bg-transparent text-[11px] text-neutral-200 placeholder-neutral-600 outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); }}>
            <X size={11} className="text-neutral-500 hover:text-white" />
          </button>
        )}
        {loading && (
          <div className="w-2 h-2 border border-blue-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900/95 border border-white/10 rounded shadow-2xl z-50 overflow-hidden">
          {results.map((r) => (
            <button
              key={r.id}
              className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              onClick={() => {
                setSelectedLocation(r.latitude, r.longitude, `${r.name}${r.country ? ', ' + r.country : ''}`);
                setQuery('');
                setResults([]);
              }}
            >
              <div className="text-[11px] text-white font-medium">{r.name}</div>
              <div className="text-[10px] text-neutral-500">
                {[r.admin1, r.country].filter(Boolean).join(', ')} · {r.latitude.toFixed(2)}, {r.longitude.toFixed(2)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. LAYER CONTROLS
// ==========================================
function LayerControls() {
  const { activeLayers, toggleLayer } = useWeatherStore();
  return (
    <div className="flex-1 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
      {layersList.map((layer) => {
        const Icon = layer.icon;
        const isActive = activeLayers.includes(layer.id);
        return (
          <label
            key={layer.id}
            className={`flex items-center gap-2 p-2 cursor-pointer transition-colors border-l-2 ${
              isActive
                ? 'bg-neutral-800/80 border-blue-500 text-white'
                : 'border-transparent text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
            }`}
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => toggleLayer(layer.id)}
              className="appearance-none w-3 h-3 border border-neutral-600 rounded-sm checked:bg-blue-500 focus:ring-0 cursor-pointer"
            />
            <Icon size={14} className={isActive ? layer.color : 'opacity-50'} />
            <span className="flex-1 truncate">{layer.name}</span>
            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
          </label>
        );
      })}
      <div className="px-2 pt-2 text-[9px] text-neutral-600 leading-relaxed">
        Radar: RainViewer · Wind/Temp/Clouds: OWM tiles
      </div>
    </div>
  );
}

// ==========================================
// 6. METEOGRAM PANEL (right)
// ==========================================
const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral-900/95 border border-white/10 rounded px-2 py-1 text-[10px] font-mono">
      <div className="text-neutral-400">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.dataKey === 'temp' ? formatTemp(p.value, unit) : `${p.value}`}
        </div>
      ))}
    </div>
  );
};

function MeteogramPanel() {
  const {
    selectedLocation, locationName, fetchWeather,
    weatherData, isLoading, error, tempUnit, toggleTempUnit,
  } = useWeatherStore();
  const [lat, lng] = selectedLocation;

  useEffect(() => {
    const t = setTimeout(() => fetchWeather(lat, lng), 800);
    return () => clearTimeout(t);
  }, [lat, lng, fetchWeather]);

  // Build 24-hour chart data from real API
  const chartData = weatherData
    ? weatherData.hourly.time.slice(0, 24).map((t, i) => ({
        time: t.slice(11, 16),
        temp: weatherData.hourly.temperature_2m[i],
        rain: weatherData.hourly.precipitation[i],
      }))
    : [];

  const now = weatherData?.hourly;
  const wCode = now?.weathercode?.[0];

  return (
    <div className="flex-1 flex flex-col p-2 gap-1.5 overflow-y-auto custom-scrollbar">
      {/* City search */}
      <CitySearch />

      {/* Header row */}
      <div className="bg-black/50 p-2 border border-white/10 rounded flex justify-between items-center">
        <div>
          <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Location</div>
          <div className="text-[11px] text-white font-medium truncate max-w-[160px]">{locationName}</div>
          <div className="font-mono text-[9px] text-neutral-500">{lat.toFixed(4)}, {lng.toFixed(4)}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isLoading ? (
            <span className="text-yellow-400 text-[10px] animate-pulse">FETCHING…</span>
          ) : error ? (
            <span className="text-red-400 text-[10px]">ERROR</span>
          ) : (
            <span className="text-green-400 text-[9px]">● LIVE</span>
          )}
          {/* °C/°F toggle */}
          <button
            onClick={toggleTempUnit}
            className="text-[10px] font-mono bg-neutral-800 hover:bg-neutral-700 border border-white/10 rounded px-2 py-0.5 transition-colors"
          >
            °{tempUnit === 'C' ? 'C → °F' : 'F → °C'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded p-2 flex items-center gap-2">
          <AlertTriangle size={12} className="text-red-400 shrink-0" />
          <div>
            <div className="text-[10px] text-red-300 font-medium">Failed to load weather data</div>
            <div className="text-[9px] text-red-400/70">{error}</div>
          </div>
        </div>
      )}

      {/* Current conditions grid */}
      {!error && (
        <div className="grid grid-cols-2 gap-1">
          {/* Temperature */}
          <div className="bg-black/50 border border-white/10 rounded p-2 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider">
              <Thermometer size={10} /> Temp
            </div>
            <div className="font-mono text-xl text-white">
              {formatTemp(now?.temperature_2m?.[0], tempUnit)}
            </div>
            <div className="text-[9px] text-neutral-500">
              {wCode != null ? WMO_CODES[wCode] || `Code ${wCode}` : '--'}
            </div>
          </div>

          {/* Rain */}
          <div className="bg-black/50 border border-white/10 rounded p-2 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider">
              <CloudRain size={10} /> Rain
            </div>
            <div className="font-mono text-xl text-blue-300">
              {now?.precipitation?.[0] ?? '--'}<span className="text-xs text-neutral-500"> mm</span>
            </div>
            <div className="text-[9px] text-neutral-500">1-hr accumulation</div>
          </div>

          {/* Wind */}
          <div className="bg-black/50 border border-white/10 rounded p-2 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider">
              <Wind size={10} /> Wind
            </div>
            <div className="font-mono text-xl text-teal-300">
              {now?.windspeed_10m?.[0] ?? '--'}<span className="text-xs text-neutral-500"> km/h</span>
            </div>
            <div className="text-[9px] text-neutral-500">
              Dir: {now?.winddirection_10m?.[0] ?? '--'}°
            </div>
          </div>

          {/* Humidity */}
          <div className="bg-black/50 border border-white/10 rounded p-2 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider">
              <Droplets size={10} /> Humidity
            </div>
            <div className="font-mono text-xl text-cyan-300">
              {now?.relative_humidity_2m?.[0] ?? '--'}<span className="text-xs text-neutral-500"> %</span>
            </div>
            <div className="text-[9px] text-neutral-500">
              UV: {now?.uv_index?.[0] ?? '--'}  ·  Press: {now?.surface_pressure?.[0] ?? '--'} hPa
            </div>
          </div>
        </div>
      )}

      {/* 24-hour temperature line chart (Recharts) */}
      {chartData.length > 0 && (
        <div className="bg-black/50 border border-white/10 rounded p-2 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider">
            <TrendingUp size={10} /> 24-hr Temperature
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 8, fill: '#6b7280' }}
                  interval={3}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 8, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    tempUnit === 'C' ? `${v}°` : `${celsiusToF(v)}°`
                  }
                />
                <Tooltip
                  content={<CustomTooltip unit={tempUnit} />}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="temp"
                  name="Temp"
                  stroke="#f87171"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 24-hour rain chart */}
      {chartData.length > 0 && (
        <div className="bg-black/50 border border-white/10 rounded p-2 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-wider">
            <CloudRain size={10} /> 24-hr Precipitation (mm)
          </div>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 8, fill: '#6b7280' }}
                  interval={3}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 8, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<CustomTooltip unit={tempUnit} />}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="rain"
                  name="Rain"
                  stroke="#60a5fa"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && !weatherData && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[10px] text-neutral-500 animate-pulse">Loading weather data…</div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 7. TIMELINE CONSOLE (bottom) — real data
// ==========================================
function TimelineConsole() {
  const { currentTime, setCurrentTime, weatherData, tempUnit } = useWeatherStore();

  // Use real hourly data (next 12 hours) or empty
  const timeData = weatherData
    ? weatherData.hourly.time.slice(0, 12).map((t, i) => ({
        time: t.slice(11, 16),
        temp: weatherData.hourly.temperature_2m[i],
        rain: weatherData.hourly.precipitation[i],
        wind: weatherData.hourly.windspeed_10m?.[i] ?? '--',
        hum:  weatherData.hourly.relative_humidity_2m?.[i] ?? '--',
        uv:   weatherData.hourly.uv_index?.[i] ?? '--',
      }))
    : [];

  if (timeData.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[10px] text-neutral-600">
        Select a location to load forecast
      </div>
    );
  }

  const cur = timeData[currentTime];

  return (
    <div className="flex flex-col flex-1 p-2 gap-2 h-full overflow-hidden">
      {/* Slider */}
      <div className="flex items-center gap-3 px-1">
        <Clock size={11} className="text-yellow-500 shrink-0" />
        <span className="font-mono text-yellow-400 text-[11px] w-12 shrink-0">
          {cur?.time || '00:00'}
        </span>
        <input
          type="range"
          min="0"
          max={timeData.length - 1}
          value={currentTime}
          onChange={(e) => setCurrentTime(parseInt(e.target.value))}
          className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-[9px] text-neutral-600 shrink-0">+12h</span>
      </div>

      {/* Scrollable table */}
      <div className="flex-1 overflow-x-auto bg-black/40 border border-white/5 rounded min-h-0">
        <table className="w-full text-center text-[10px]">
          <thead className="border-b border-white/5">
            <tr>
              <th className="px-2 py-1 text-left text-neutral-500 w-20 sticky left-0 bg-neutral-900 border-r border-white/5 z-10">
                Param
              </th>
              {timeData.map((d, i) => (
                <th
                  key={i}
                  className={`px-2 py-1 font-mono min-w-[52px] text-[9px] cursor-pointer select-none ${
                    currentTime === i
                      ? 'text-yellow-400 bg-white/5'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  onClick={() => setCurrentTime(i)}
                >
                  {d.time}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Temperature */}
            <tr className="border-b border-white/5">
              <td className="px-2 py-1 text-left text-neutral-500 sticky left-0 bg-neutral-900 border-r border-white/5 z-10">
                <span className="flex items-center gap-1"><Thermometer size={9} />Temp</span>
              </td>
              {timeData.map((d, i) => (
                <td
                  key={i}
                  className={`font-mono py-1 ${
                    currentTime === i ? 'bg-white/5' : ''
                  } ${d.temp > 33 ? 'text-red-400' : d.temp > 28 ? 'text-orange-300' : 'text-neutral-300'}`}
                >
                  {formatTemp(d.temp, tempUnit)}
                </td>
              ))}
            </tr>

            {/* Rain */}
            <tr className="border-b border-white/5">
              <td className="px-2 py-1 text-left text-neutral-500 sticky left-0 bg-neutral-900 border-r border-white/5 z-10">
                <span className="flex items-center gap-1"><CloudRain size={9} />Rain</span>
              </td>
              {timeData.map((d, i) => (
                <td
                  key={i}
                  className={`font-mono py-1 ${
                    currentTime === i ? 'bg-white/5' : ''
                  } ${d.rain > 10 ? 'text-blue-300' : d.rain > 0 ? 'text-blue-500' : 'text-neutral-600'}`}
                >
                  {d.rain}
                </td>
              ))}
            </tr>

            {/* Wind */}
            <tr className="border-b border-white/5">
              <td className="px-2 py-1 text-left text-neutral-500 sticky left-0 bg-neutral-900 border-r border-white/5 z-10">
                <span className="flex items-center gap-1"><Wind size={9} />Wind</span>
              </td>
              {timeData.map((d, i) => (
                <td
                  key={i}
                  className={`font-mono py-1 ${currentTime === i ? 'bg-white/5' : ''} ${
                    d.wind > 30 ? 'text-teal-300' : 'text-neutral-400'
                  }`}
                >
                  {d.wind}
                </td>
              ))}
            </tr>

            {/* Humidity */}
            <tr className="border-b border-white/5">
              <td className="px-2 py-1 text-left text-neutral-500 sticky left-0 bg-neutral-900 border-r border-white/5 z-10">
                <span className="flex items-center gap-1"><Droplets size={9} />RH%</span>
              </td>
              {timeData.map((d, i) => (
                <td
                  key={i}
                  className={`font-mono py-1 ${currentTime === i ? 'bg-white/5' : ''} text-cyan-400`}
                >
                  {d.hum}
                </td>
              ))}
            </tr>

            {/* UV */}
            <tr>
              <td className="px-2 py-1 text-left text-neutral-500 sticky left-0 bg-neutral-900 border-r border-white/5 z-10">
                <span className="flex items-center gap-1"><Sun size={9} />UV</span>
              </td>
              {timeData.map((d, i) => (
                <td
                  key={i}
                  className={`font-mono py-1 ${currentTime === i ? 'bg-white/5' : ''} ${
                    d.uv >= 8 ? 'text-red-400' : d.uv >= 6 ? 'text-orange-400' : d.uv >= 3 ? 'text-yellow-400' : 'text-neutral-500'
                  }`}
                >
                  {d.uv}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 8. MAP WITH REAL TILE OVERLAYS
// ==========================================
function WeatherMap() {
  const { setSelectedLocation, activeLayers, rainviewerTs } = useWeatherStore();
  const [hud, setHud] = useState({ show: false, x: 0, y: 0, lat: 0, lng: 0 });

  const onMouseMove = useCallback((e) => {
    setHud({
      show: true,
      x: e.point.x,
      y: e.point.y,
      lat: e.lngLat.lat.toFixed(4),
      lng: e.lngLat.lng.toFixed(4),
    });
  }, []);

  const { sources, layers } = buildOverlayLayers(activeLayers, rainviewerTs);

  return (
    <div className="w-full h-full relative cursor-crosshair">
      <Map
        initialViewState={{ longitude: 100.5018, latitude: 13.7563, zoom: 5 }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHud((p) => ({ ...p, show: false }))}
        onClick={(e) => setSelectedLocation(e.lngLat.lat, e.lngLat.lng)}
        interactiveLayerIds={[]}
      >
        {/* Dynamic tile overlays */}
        {sources.map((src) => (
          <Source key={src.id} id={src.id} type="raster" tiles={src.tiles} tileSize={src.tileSize} attribution={src.attribution}>
            {layers
              .filter((l) => l.source === src.id)
              .map((l) => (
                <Layer key={l.id} id={l.id} type="raster" paint={l.paint} />
              ))}
          </Source>
        ))}
      </Map>

      {/* HUD */}
      {hud.show && (
        <div
          className="absolute z-10 bg-black/90 border border-neutral-700 text-[10px] p-1.5 rounded pointer-events-none text-green-400 font-mono shadow-2xl backdrop-blur-sm"
          style={{ top: hud.y + 15, left: hud.x + 15 }}
        >
          LAT: {hud.lat}
          <br />
          LNG: {hud.lng}
        </div>
      )}

      {/* Cross-hair */}
      <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

// ==========================================
// 9. MOBILE BOTTOM NAV
// ==========================================
function MobileNav() {
  const { mobilePanel, setMobilePanel } = useWeatherStore();
  const tabs = [
    { id: 'layers',   label: 'Layers',   icon: Layers },
    { id: 'analysis', label: 'Analysis', icon: Eye },
    { id: 'timeline', label: 'Timeline', icon: Clock },
  ];
  return (
    <div className="flex bg-neutral-900/90 backdrop-blur-md border-t border-white/10 pointer-events-auto">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setMobilePanel(id)}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[9px] transition-colors ${
            mobilePanel === id ? 'text-blue-400' : 'text-neutral-500'
          }`}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ==========================================
// 10. MAIN APP
// ==========================================
export default function App() {
  const { fetchRainviewerTs, mobilePanel } = useWeatherStore();

  // Fetch RainViewer timestamp on mount
  useEffect(() => {
    fetchRainviewerTs();
    const interval = setInterval(fetchRainviewerTs, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRainviewerTs]);

  return (
    <div className="h-screen w-screen overflow-hidden text-neutral-200 font-sans text-xs relative bg-neutral-950">

      {/* Background Map */}
      <div className="absolute inset-0 z-0">
        <WeatherMap />
      </div>

      {/* ─── DESKTOP LAYOUT (md+) ─── */}
      <div className="hidden md:flex absolute inset-0 z-10 pointer-events-none flex-col justify-between p-4">
        <div className="flex justify-between items-start flex-1 h-full overflow-hidden gap-4 pb-4">

          {/* Left Panel — Layers */}
          <div className="w-56 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-xl flex flex-col shadow-2xl pointer-events-auto h-full overflow-hidden">
            <div className="p-3 border-b border-white/10 font-bold tracking-wider text-neutral-400 uppercase text-[10px] flex items-center gap-1.5">
              <Layers size={11} /> Data Layers
            </div>
            <LayerControls />
          </div>

          {/* Right Panel — Analysis */}
          <div className="w-80 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-xl flex flex-col shadow-2xl pointer-events-auto h-full overflow-hidden">
            <div className="p-3 border-b border-white/10 font-bold tracking-wider text-neutral-400 uppercase text-[10px] flex items-center gap-1.5">
              <Eye size={11} /> Location Analysis
            </div>
            <MeteogramPanel />
          </div>
        </div>

        {/* Bottom Panel — Timeline */}
        <div className="h-36 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-xl flex flex-col shadow-2xl pointer-events-auto shrink-0">
          <div className="p-2 px-4 border-b border-white/10 font-bold tracking-wider text-neutral-400 uppercase text-[10px] flex justify-between items-center">
            <span className="flex items-center gap-1.5"><Clock size={11} /> Timeline Forecast</span>
            <span className="text-green-400/80 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
            </span>
          </div>
          <TimelineConsole />
        </div>
      </div>

      {/* ─── MOBILE LAYOUT (<md) ─── */}
      <div className="flex md:hidden absolute inset-0 z-10 pointer-events-none flex-col">
        {/* Top sheet (active panel) */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="h-[55vh] bg-neutral-900/90 backdrop-blur-md border-t border-white/10 flex flex-col pointer-events-auto overflow-hidden">
            {mobilePanel === 'layers' && (
              <>
                <div className="p-3 border-b border-white/10 text-[10px] font-bold uppercase text-neutral-400 flex items-center gap-1.5">
                  <Layers size={11} /> Data Layers
                </div>
                <LayerControls />
              </>
            )}
            {mobilePanel === 'analysis' && (
              <>
                <div className="p-3 border-b border-white/10 text-[10px] font-bold uppercase text-neutral-400 flex items-center gap-1.5">
                  <Eye size={11} /> Location Analysis
                </div>
                <MeteogramPanel />
              </>
            )}
            {mobilePanel === 'timeline' && (
              <>
                <div className="p-3 border-b border-white/10 text-[10px] font-bold uppercase text-neutral-400 flex items-center gap-1.5 justify-between">
                  <span className="flex items-center gap-1.5"><Clock size={11} /> Timeline</span>
                  <span className="text-green-400/80 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" /> LIVE
                  </span>
                </div>
                <TimelineConsole />
              </>
            )}
          </div>
        </div>

        {/* Bottom nav */}
        <MobileNav />
      </div>

    </div>
  );
}
