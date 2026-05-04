import React, { useState, useCallback, useEffect } from 'react';
import { create } from 'zustand';
// อัปเดต: ใช้ import แบบเฉพาะสำหรับ maplibre เพื่อไม่ให้ติดปัญหา Mapbox Token
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CloudRain, Wind, Thermometer, Gauge, Waves, CloudLightning, Sun } from 'lucide-react';

// ==========================================
// 1. STATE MANAGEMENT & API LOGIC (Zustand)
// ==========================================
const CACHE_TIME = 15 * 60 * 1000; // Cache 15 นาที

const useWeatherStore = create((set, get) => ({
  activeLayers: ['radar'],
  selectedLocation: [13.7563, 100.5018], // Default: BKK
  currentTime: 0,
  weatherData: null,
  isLoading: false,
  
  toggleLayer: (layerId) => set((state) => ({
    activeLayers: state.activeLayers.includes(layerId)
      ? state.activeLayers.filter(id => id !== layerId)
      : [...state.activeLayers, layerId]
  })),
  
  setSelectedLocation: (lat, lng) => set({ selectedLocation: [lat, lng] }),
  setCurrentTime: (timeIndex) => set({ currentTime: timeIndex }),

  fetchWeather: async (lat, lng) => {
    const cacheKey = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_TIME) {
        set({ weatherData: data, isLoading: false });
        return; 
      }
    }

    set({ isLoading: true });
    try {
      // ดึง API จริงจาก Open-Meteo
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation,surface_pressure`);
      const data = await res.json();

      localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      set({ weatherData: data, isLoading: false });
    } catch (error) {
      console.error("Fetch error:", error);
      set({ isLoading: false });
    }
  }
}));

// ==========================================
// 2. COMPONENTS
// ==========================================

// --- 2.1 Layer Controls (Left Panel) ---
const layersList = [
  { id: 'radar', name: 'Rain Radar', icon: CloudRain, color: 'text-blue-400' },
  { id: 'wind', name: 'Wind Gusts', icon: Wind, color: 'text-teal-400' },
  { id: 'temp', name: 'Temperature', icon: Thermometer, color: 'text-red-400' },
  { id: 'pressure', name: 'Pressure Isobars', icon: Gauge, color: 'text-purple-400' },
  { id: 'waves', name: 'Swell & Waves', icon: Waves, color: 'text-cyan-400' },
  { id: 'clouds', name: 'Cloud Cover', icon: Sun, color: 'text-gray-400' },
  { id: 'storms', name: 'Thunderstorms', icon: CloudLightning, color: 'text-yellow-400' },
];

function LayerControls() {
  const { activeLayers, toggleLayer } = useWeatherStore();
  return (
    <div className="flex-1 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
      {layersList.map(layer => {
        const Icon = layer.icon;
        const isActive = activeLayers.includes(layer.id);
        return (
          <label key={layer.id} className={`flex items-center gap-2 p-2 cursor-pointer transition-colors border-l-2 ${isActive ? 'bg-neutral-800/80 border-blue-500 text-white' : 'border-transparent text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <input type="checkbox" checked={isActive} onChange={() => toggleLayer(layer.id)} className="appearance-none w-3 h-3 border border-neutral-600 rounded-sm checked:bg-blue-500 focus:ring-0 cursor-pointer" />
            <Icon size={14} className={isActive ? layer.color : 'opacity-50'} />
            <span className="flex-1 truncate">{layer.name}</span>
            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>}
          </label>
        );
      })}
    </div>
  );
}

// --- 2.2 Meteogram Panel (Right Panel - With Debounce) ---
function MeteogramPanel() {
  const { selectedLocation, fetchWeather, weatherData, isLoading } = useWeatherStore();
  const [lat, lng] = selectedLocation;

  // 🛡️ Debounce API Call (800ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWeather(lat, lng);
    }, 800);
    return () => clearTimeout(timer);
  }, [lat, lng, fetchWeather]);

  return (
    <div className="flex-1 flex flex-col p-2 gap-1.5 overflow-y-auto custom-scrollbar">
      <div className="bg-black/50 p-2 border border-white/10 flex justify-between items-center rounded">
        <span className="text-neutral-400 text-[10px]">COORDINATES</span>
        {isLoading ? (
          <span className="text-yellow-400 text-[10px] animate-pulse">FETCHING...</span>
        ) : (
          <span className="font-mono text-green-400 font-bold">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
        )}
      </div>

      {/* Real Data Integration Box */}
      <div className="bg-black/50 border border-white/10 p-2 rounded flex flex-col gap-1">
        <div className="text-[9px] text-neutral-400">REAL-TIME DATA (OPEN-METEO)</div>
        <div className="font-mono text-lg text-white">
          {weatherData ? `${weatherData.hourly.temperature_2m[0]}°C` : '--°C'}
        </div>
        <div className="flex gap-4 text-[10px] text-neutral-400 font-mono">
           <span>Rain: {weatherData ? weatherData.hourly.precipitation[0] : '--'} mm</span>
           <span>Press: {weatherData ? weatherData.hourly.surface_pressure[0] : '--'} hPa</span>
        </div>
      </div>

      {/* Graph 1: Mock Temperature Array */}
      <div className="h-24 bg-black/50 border border-white/10 p-1 flex flex-col relative rounded mt-2">
         <div className="text-[9px] text-neutral-500 absolute top-1 left-1 z-10">TEMPERATURE FORECAST</div>
         <div className="flex-1 flex items-end gap-[1px] pt-4 px-1">
            {[28, 29, 31, 33, 34, 32, 30, 28, 27, 26, 25, 24].map((val, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-red-900/50 to-red-500/80 relative group" style={{ height: `${(val / 40) * 100}%` }}>
                 <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] opacity-0 group-hover:opacity-100 font-mono text-red-300">{val}°</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}

// --- 2.3 Timeline Console (Bottom Panel) ---
const mockTimeData = [
  { time: '12:00', temp: 31, rain: 0, wind: 12 }, { time: '13:00', temp: 33, rain: 2, wind: 15 },
  { time: '14:00', temp: 34, rain: 15, wind: 22 }, { time: '15:00', temp: 32, rain: 25, wind: 28 },
  { time: '16:00', temp: 30, rain: 10, wind: 18 }, { time: '17:00', temp: 28, rain: 5, wind: 14 }
];

function TimelineConsole() {
  const { currentTime, setCurrentTime } = useWeatherStore();
  return (
    <div className="flex flex-col flex-1 p-2 gap-2 h-full">
      <div className="flex items-center gap-4 px-2">
        <span className="font-mono text-yellow-500 text-sm w-12">{mockTimeData[currentTime]?.time || '00:00'}</span>
        <input 
          type="range" min="0" max={mockTimeData.length - 1} value={currentTime} 
          onChange={(e) => setCurrentTime(parseInt(e.target.value))}
          className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>
      <div className="flex-1 overflow-x-auto bg-black/40 border border-white/5 rounded">
        <table className="w-full text-center text-[10px]">
          <thead className="border-b border-white/5">
            <tr>
              <th className="px-2 py-1 text-left text-neutral-500 w-24 sticky left-0 bg-neutral-900 border-r border-white/5">Params</th>
              {mockTimeData.map((d, i) => (
                <th key={i} className={`px-2 py-1 font-mono min-w-[60px] ${currentTime === i ? 'text-yellow-400 bg-white/5' : 'text-neutral-400'}`}>{d.time}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-1 text-left text-neutral-500 sticky left-0 bg-neutral-900 border-r border-white/5">Temp (°C)</td>
              {mockTimeData.map((d, i) => (<td key={i} className={`font-mono ${d.temp > 32 ? 'text-red-400' : 'text-neutral-300'}`}>{d.temp}°</td>))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- 2.4 Map Area ---
function WeatherMap() {
  const { setSelectedLocation } = useWeatherStore();
  const [hud, setHud] = useState({ show: false, x: 0, y: 0, lat: 0, lng: 0 });

  const onMouseMove = useCallback((e) => {
    setHud({ show: true, x: e.point.x, y: e.point.y, lat: e.lngLat.lat.toFixed(4), lng: e.lngLat.lng.toFixed(4) });
  }, []);

  return (
    <div className="w-full h-full relative cursor-crosshair">
      <Map
        initialViewState={{ longitude: 100.5018, latitude: 13.7563, zoom: 5 }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHud(prev => ({ ...prev, show: false }))}
        onClick={(e) => setSelectedLocation(e.lngLat.lat, e.lngLat.lng)}
        interactiveLayerIds={[]} 
      />
      
      {/* Floating HUD */}
      {hud.show && (
        <div className="absolute z-10 bg-black/90 border border-neutral-700 text-[10px] p-1.5 rounded pointer-events-none text-green-400 font-mono shadow-2xl backdrop-blur-sm"
             style={{ top: hud.y + 15, left: hud.x + 15 }}>
          LAT: {hud.lat}<br/>LNG: {hud.lng}
        </div>
      )}
      
      {/* Center Marker */}
      <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
    </div>
  );
}

// ==========================================
// 3. MAIN APP COMPONENT (Glassmorphism UI)
// ==========================================
export default function App() {
  return (
    <div className="h-screen w-screen overflow-hidden text-neutral-200 font-sans text-xs relative bg-neutral-950">
      
      {/* Background Map */}
      <div className="absolute inset-0 z-0">
        <WeatherMap />
      </div>

      {/* Floating Dashboard Elements */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4">
        
        <div className="flex justify-between items-start flex-1 h-full overflow-hidden gap-4 pb-4">
          {/* Left Panel */}
          <div className="w-64 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-xl flex flex-col shadow-2xl pointer-events-auto h-full overflow-hidden">
            <div className="p-3 border-b border-white/10 font-bold tracking-wider text-neutral-400 uppercase text-[10px]">Data Layers</div>
            <LayerControls />
          </div>

          {/* Right Panel */}
          <div className="w-80 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-xl flex flex-col shadow-2xl pointer-events-auto h-full overflow-hidden">
            <div className="p-3 border-b border-white/10 font-bold tracking-wider text-neutral-400 uppercase text-[10px]">Location Analysis</div>
            <MeteogramPanel />
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="h-32 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-xl flex flex-col shadow-2xl pointer-events-auto shrink-0">
          <div className="p-2 px-4 border-b border-white/10 font-bold tracking-wider text-neutral-400 uppercase text-[10px] flex justify-between">
            <span>Timeline Forecast</span>
            <span className="text-green-400/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> LIVE
            </span>
          </div>
          <TimelineConsole />
        </div>

      </div>
    </div>
  );
}
