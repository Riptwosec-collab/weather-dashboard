# Weather Dashboard Changelog

All notable changes are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/).

---

## [2.0.0] — 2025-01

### ✨ Features

- Full TypeScript migration (strict mode) across all files
- **AQI panel** — PM2.5, PM10, O₃, NO₂, CO from Open-Meteo Air Quality API
- **Compare mode** — side-by-side weather for up to 3 cities
- **Rain probability** — `precipitation_probability` in timeline + 7-day forecast
- **Historical overlay** — same-day last-year temperature on 24-hr chart
- **Shareable URL** — `?lat=&lng=&unit=&name=` deep links
- **Map fly-to** — animated MapLibre `flyTo()` on city select
- **Keyboard shortcuts** — `/` search, `L` layers, `T` timeline, `U` unit, `S` share
- **Light / dark theme** — Tailwind `dark:` class strategy, persisted
- **Onboarding toast** — first-visit feature introduction
- **Auto-detect location** — browser Geolocation API button
- **Saved locations** — bookmark up to 5 cities, persisted
- **Location pin on map** — MapLibre Marker at selected coords
- **7-day forecast tab** — daily min/max, rain, UV, wind, sunrise/sunset
- **Sunrise/sunset** — from Open-Meteo `daily` params
- **PWA + offline** — Workbox service worker caches API + map tiles
- **Error boundary** — component-level crash recovery

### 🐛 Bug Fixes

- Fixed `404: NOT_FOUND` on Vercel SPA refresh (`vercel.json` rewrite rule)
- Fixed mock data in `TimelineConsole` — now uses real API data
- Fixed layer toggles not connecting to map tiles

### ♻️ Refactors

- Split 924-line `App.jsx` into 14 focused TypeScript files
- Extracted `useWeather`, `useGeocoding`, `useShareableUrl`, `useKeyboardShortcuts` hooks
- Zustand store with `persist` middleware for user preferences
- Zustand store now covers AQI, historical, and compare fetches

---

## [1.0.0] — Initial release

- React + MapLibre weather dashboard
- Open-Meteo API integration
- RainViewer radar tiles
- Basic layer controls
