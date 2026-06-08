# 🌦️ Weather Dashboard

A real-time weather monitoring dashboard built with **React**, **MapLibre GL**, **Open-Meteo**, and **Recharts**. Features live rain radar overlays, 24-hour forecasts, and city search — all with zero required API keys.

![Stack](https://img.shields.io/badge/React-18-blue?logo=react)
![Stack](https://img.shields.io/badge/Vite-5-purple?logo=vite)
![Stack](https://img.shields.io/badge/Tailwind-3-teal?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

**Live demo:** https://weather-dashboard-riptwosec.vercel.app

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗺️ **Interactive Map** | Dark-themed MapLibre GL map (CartoDB Dark Matter). Click anywhere to get weather. |
| 🌧️ **Live Radar Tiles** | RainViewer precipitation radar refreshed every 10 minutes |
| 🌡️ **Real-time Weather** | Temperature, rain, wind, humidity, UV index, pressure via Open-Meteo |
| 📈 **24-hr Charts** | Recharts line charts for temperature and precipitation |
| 🕐 **Timeline Forecast** | Scrollable 12-hour table with colour-coded values |
| 🔍 **City Search** | Geocoding via Open-Meteo (no API key needed) |
| 🌡️ **°C / °F Toggle** | Switch units globally |
| 📱 **Responsive** | Desktop sidepanels + mobile bottom-sheet with tab nav |
| ⚡ **15-min Cache** | `localStorage` cache prevents redundant API calls |
| 🚨 **Error States** | Friendly error UI when API calls fail |

---

## 🏗️ Tech Stack

| Layer | Library |
|-------|---------|
| UI Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Map | `react-map-gl` (MapLibre adapter) + `maplibre-gl` |
| State | Zustand |
| Charts | Recharts |
| Icons | Lucide React |
| Weather API | [Open-Meteo](https://open-meteo.com/) — **free, no key** |
| Radar tiles | [RainViewer](https://www.rainviewer.com/api.html) — **free, no key** |
| Geocoding | Open-Meteo Geocoding API — **free, no key** |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js ≥ 18**
- npm or pnpm

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/Riptwosec-collab/weather-dashboard.git
cd weather-dashboard

# 2. Install dependencies
npm install
# or
pnpm install

# 3. Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — no `.env` needed for basic usage.

### Build for production

```bash
npm run build
npm run preview   # preview the production build locally
```

---

## ⚙️ Environment Variables (optional)

Create a `.env.local` file if you want to swap the tile providers:

```env
# Optional: your own OpenWeatherMap key for Wind/Temp/Cloud tile overlays
# Get a free key at https://openweathermap.org/appid
VITE_OWM_API_KEY=your_openweathermap_key_here

# Optional: Override the base map style (any MapLibre-compatible style URL)
VITE_MAP_STYLE=https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json
```

> **Without these vars the app still works fully** — Rain Radar (RainViewer) and all weather data (Open-Meteo) require no keys. Only Wind/Temp/Cloud tile overlays fall back to the `demo` key (low rate limit).

Copy `.env.example` to get started:

```bash
cp .env.example .env.local
```

---

## 📁 Project Structure

```
weather-dashboard/
├── src/
│   └── App.jsx          # Single-file app (components + store + API logic)
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
├── .env.example
└── README.md
```

---

## 🗺️ Map Layer Sources

| Layer toggle | Tile provider | Requires key? |
|---|---|---|
| Rain Radar | RainViewer v2 | No |
| Wind Gusts | OpenWeatherMap tiles | Free key recommended |
| Temperature | OpenWeatherMap tiles | Free key recommended |
| Cloud Cover | OpenWeatherMap tiles | Free key recommended |
| Pressure / Waves / Storms | *(coming soon)* | — |

---

## 🛠️ Development Notes

### Adding a new weather parameter
1. Add it to the `params` array in `useWeatherStore.fetchWeather()`.
2. Access it via `weatherData.hourly.<param_name>[i]` in the components.
3. Add a card in `MeteogramPanel` and a row in `TimelineConsole`.

### Changing the default location
Edit the `selectedLocation` initial value in the Zustand store:
```js
selectedLocation: [YOUR_LAT, YOUR_LNG],
locationName: 'Your City',
```

### Cache duration
The `CACHE_TIME` constant at the top of `App.jsx` controls how long weather data is cached in `localStorage` (default: 15 minutes).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push and open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

## 🙏 Credits

- [Open-Meteo](https://open-meteo.com/) — free weather API
- [RainViewer](https://www.rainviewer.com/) — free radar tiles
- [CartoDB](https://carto.com/basemaps/) — Dark Matter map tiles
- [MapLibre](https://maplibre.org/) — open-source map renderer
