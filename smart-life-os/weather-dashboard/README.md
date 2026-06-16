# 🌦️ Weather Dashboard v3

Real-time weather monitoring — TypeScript, React 18, MapLibre GL, Open-Meteo, PWA. **Zero required API keys.**

![CI](https://github.com/Riptwosec-collab/weather-dashboard/actions/workflows/ci.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)
![PWA](https://img.shields.io/badge/PWA-offline--ready-green)
![License](https://img.shields.io/badge/license-MIT-green)

**Live demo:** https://weather-dashboard-riptwosec.vercel.app

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗺️ **Interactive map** | MapLibre GL + animated `flyTo()` on city change |
| 📍 **Location pin** | Marker bubble at selected location |
| 🔍 **City search** | Open-Meteo Geocoding, debounced, no key |
| 🔖 **Saved locations** | Bookmark 5 cities, persisted |
| 📍 **Auto-detect** | Browser Geolocation one-tap |
| 🌧️ **Live radar** | RainViewer tiles, refreshed every 10 min |
| 🌡️ **Current conditions** | Temp, rain, wind, humidity, UV, pressure |
| 📈 **24-hr charts** | Temperature (+ last-year overlay) + rain+probability bar |
| 🌅 **Sunrise / Sunset** | From Open-Meteo daily params |
| 📅 **7-day forecast** | Min/max, rain probability %, UV, wind |
| 🕐 **12-hr timeline** | Table: temp, rain, rain%, wind, humidity, UV |
| 🌫️ **AQI panel** | PM2.5, PM10, O₃, NO₂, CO gauge bars |
| 🆚 **Compare mode** | Side-by-side weather for up to 3 cities |
| 📅 **Historical overlay** | Same-day last-year temp on 24-hr chart |
| 🔗 **Shareable URL** | `?lat=&lng=&unit=` deep links |
| ⌨️ **Keyboard shortcuts** | `/` search · `L` layers · `T` timeline · `U` unit · `S` share |
| 🌡️ **°C / °F toggle** | Global, persisted |
| 🌙 **Light / dark theme** | Persisted via Zustand |
| 🚨 **Weather alerts** | Configurable rain/wind/UV/AQI thresholds |
| 📱 **Responsive** | Desktop panels + mobile bottom-sheet |
| 📦 **PWA + offline** | Workbox caches API + map tiles |
| 🧭 **Onboarding** | First-visit feature tour |
| 🛡️ **Error boundary** | Component-level crash recovery |

---

## 🏗️ Tech Stack

| Layer | Library |
|-------|---------|
| UI | React 18 + Vite 5 |
| Language | TypeScript 5.5 (strict) |
| Styling | Tailwind CSS v3 (dark/light) |
| Map | react-map-gl / MapLibre GL |
| State | Zustand 4 + persist |
| Charts | Recharts |
| Icons | Lucide React |
| PWA | vite-plugin-pwa (Workbox) |
| Tests | Vitest + Testing Library |
| E2E | Playwright |
| Linting | ESLint 9 flat config + Prettier |
| Git hooks | Husky + lint-staged |
| Release | semantic-release |
| Container | Docker + docker-compose |
| CI/CD | GitHub Actions → Vercel |

---

## 📁 Project Structure

```
weather-dashboard/
├── .github/workflows/ci.yml    # Lint → Test → E2E → Deploy → Release
├── .husky/pre-commit           # lint-staged on commit
├── e2e/dashboard.spec.ts       # Playwright E2E tests
├── src/
│   ├── types/index.ts          # All TypeScript interfaces
│   ├── store/weatherStore.ts   # Zustand + all API fetches
│   ├── hooks/
│   │   ├── useWeather.ts       # Fetch + alert detection
│   │   ├── useGeocoding.ts     # City search
│   │   ├── useShareableUrl.ts  # URL ↔ store sync
│   │   └── useKeyboardShortcuts.ts
│   ├── utils/helpers.ts        # Pure functions + tile builder
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   ├── WeatherMap.tsx      # Map + flyTo + share + locate
│   │   ├── LayerControls.tsx   # Layer toggles + theme switch
│   │   ├── CitySearch.tsx      # Search + saved location pills
│   │   ├── AlertBanner.tsx     # Threshold alerts
│   │   ├── AQIPanel.tsx        # Air quality gauges
│   │   ├── ComparePanel.tsx    # Side-by-side city comparison
│   │   ├── MeteogramPanel.tsx  # Tabs: Current/7-Day/AQI/Compare
│   │   ├── TimelineConsole.tsx # 12-hr table with rain probability
│   │   └── MobileNav.tsx
│   ├── styles/index.css        # Tailwind + light theme tokens
│   ├── main.tsx
│   └── App.tsx                 # Orchestrator, no business logic
├── src/__tests__/              # Vitest unit tests
├── Dockerfile                  # Multi-stage: dev / prod / e2e
├── docker-compose.yml
├── nginx.conf
├── vercel.json                 # SPA rewrite + security headers
├── playwright.config.ts
├── release.config.js           # semantic-release
├── eslint.config.js
├── .prettierrc
├── .lintstagedrc
├── CHANGELOG.md
└── README.md
```

---

## 🚀 Getting Started

```bash
git clone https://github.com/Riptwosec-collab/weather-dashboard.git
cd weather-dashboard
npm install
npm run dev         # http://localhost:5173
```

### All commands

```bash
npm run dev             # Dev server with HMR
npm run build           # Type-check + production build
npm run analyze         # Build + open bundle visualizer
npm run preview         # Preview production build
npm run test            # Unit tests
npm run test:coverage   # Coverage report → /coverage
npm run test:e2e        # Playwright E2E tests
npm run test:e2e:ui     # Playwright UI mode
npm run lint            # ESLint
npm run lint:fix        # ESLint --fix
npm run format          # Prettier write
npm run typecheck       # tsc --noEmit
```

### Docker

```bash
# Development (HMR)
docker compose up dev

# Production preview (Nginx)
docker compose up prod          # http://localhost:8080

# E2E tests inside container
docker compose up e2e
```

---

## ⚙️ Environment Variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_OWM_API_KEY` | No | OpenWeatherMap key for Wind/Temp/Cloud tiles |
| `VITE_MAP_STYLE` | No | Custom MapLibre style URL |

---

## 🔐 GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | From https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | From `vercel link` → `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | From `vercel link` → `.vercel/project.json` |
| `VITE_OWM_API_KEY` | Optional OWM key |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus city search |
| `L` | Switch to Layers panel |
| `T` | Switch to Timeline panel |
| `A` | Switch to Analysis panel |
| `U` | Toggle °C / °F |
| `S` | Copy share link |
| `Esc` | Blur focused input |

---

## 🤝 Contributing

```bash
git checkout -b feat/my-feature
git commit -m "feat: add my feature"   # Conventional Commits
```

CI runs automatically. Preview URL posted as PR comment.

---

## 📄 License

MIT
