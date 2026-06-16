# Smart Life OS

Modular personal dashboard web app for Thai users. The Weather Dashboard now lives inside this project and is published under `/weather-dashboard`.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Zustand
- MapLibre GL
- Next.js API Routes
- Optional Upstash Redis cache

## Run locally

From repository root:

```bash
npm install
npm run smart:dev
```

Or from this folder:

```bash
cd smart-life-os
npm install
npm run dev
```

Open `http://localhost:3000`.

## Features included

- Gamified onboarding quiz
- Role-based widget ordering
- Toggle and reorder widgets
- AI Daily Briefing UI
- Weather & Map widget with MapLibre
- Food Radar widget
- Market & Wealth tracker with average cost calculator
- Tech utilities: MAC converter, DHCP pool checker, WHOIS route, cert flashcards
- Single affiliate purchase link via `NEXT_PUBLIC_AFFILIATE_BUY_LINK`

## API route rule

Client components call only internal routes:

- `/api/weather`
- `/api/places`
- `/api/market`
- `/api/briefing`
- `/api/tech/mac`
- `/api/tech/dhcp`
- `/api/tech/whois`

External APIs are called server-side from route handlers only.

## Optional environment variables

```env
CLAUDE_API_KEY=
CLAUDE_MODEL=claude-3-5-haiku-latest
SMART_LIFE_OS_USE_REDIS=1
```

When Redis is enabled, configure the Upstash environment expected by `Redis.fromEnv()` in the hosting provider. Without Redis, the app falls back to in-memory cache for local development.

Food Radar currently ships with safe mock data, ready to swap to Google Places or Foursquare in `/app/api/places/route.ts`.

## Cache policy

The cache helper keeps the same TTL policy whether Redis or local memory is used:

- weather: 15 minutes
- market: 1 minute
- places: 6 hours
- briefing: 10 minutes
- tech: 30 minutes

## Deploy notes

On Vercel, set Root Directory to:

```txt
smart-life-os
```

Or deploy the repo root and run:

```bash
npm run smart:build
npm run smart:start
```
