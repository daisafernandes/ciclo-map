# CicloMap CWB

Interactive map for exploring and planning cycling routes in Curitiba, Brazil. Visualizes the city's cycling infrastructure (bike paths, bike lanes, shared routes) with route planning, elevation profiles, weather integration, neighborhood statistics, and route sharing.

## Features

- Interactive map of Curitiba's cycling network (IPPUC / GeoCuritiba data)
- Two routing modes: IPPUC network (cycle paths on the map) and OSRM (full road network, bicycle profile)
- Multiple route alternatives with difficulty score (Easy / Moderate / Hard)
- Elevation profile chart along routes
- Real-time weather data and cycling-specific alerts (Open-Meteo)
- Neighborhood ranking by cycling infrastructure
- Parks and Bicicuritiba bike stations overlay
- Geolocation ("Where am I")
- Favorite cycle paths (persisted in LocalStorage)
- URL-based route sharing (origin, destination, filters, theme encoded in query params)
- Dark / Light / Satellite map themes
- Progressive Web App (PWA) — installable, works offline
- Responsive layout, mobile-optimized

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript + Vite 5.4 (SWC) |
| Maps | Leaflet + React-Leaflet |
| Routing engine | OSRM (bicycle profile) + custom IPPUC network graph |
| Geocoding | Nominatim (OpenStreetMap) |
| Weather | Open-Meteo API |
| Elevation | Open-Elevation API (SRTM) |
| POIs | Overpass API (parks) |
| Geometry | Turf.js |
| UI components | shadcn/ui (Radix UI + Tailwind CSS) |
| State / caching | TanStack React Query v5 |
| Charts | Recharts |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| Routing (SPA) | React Router v6 |
| PWA | vite-plugin-pwa (Workbox) |
| Testing | Vitest (unit) + Playwright (e2e) |
| Deployment | Vercel |

## Environment Variables

Copy `.env.example` to `.env` and fill in the variables you need. All are optional — the app falls back to public endpoints or static data.

| Variable | Default | Description |
|---|---|---|
| `VITE_CICLOVIAS_LIVE_URL` | _(static fallback)_ | GeoJSON/ArcGIS URL for live cycling network data (IPPUC / GeoCuritiba) |
| `VITE_OSRM_URL` | `/osrm` proxy | OSRM base URL (no trailing slash). The public server may not expose the `cycling` profile — host your own instance if needed |
| `VITE_ELEVATION_URL` | Open-Elevation public API | Alternative elevation endpoint (`POST`, same format as Open-Elevation) |
| `VITE_OVERPASS_URL` | `/overpass-api` proxy | Overpass API for parks and POIs |
| `VITE_NOMINATIM_URL` | `/nominatim` proxy | Nominatim geocoding endpoint |
| `VITE_TRAFFIC_HISTORY_URL` | _(demo data)_ | Traffic history API returning `[{hour, movement, cyclists}]` |

### API Proxies

Both the Vite dev server and Vercel production rewrite the following paths to avoid CORS:

| Path | Target |
|---|---|
| `/ippuc-arcgis/*` | GeoCuritiba IPPUC ArcGIS server |
| `/osrm/*` | `router.project-osrm.org` |
| `/nominatim/*` | `nominatim.openstreetmap.org` |
| `/overpass-api/*` | `overpass-api.de` |

## URL Parameters

Routes can be fully shared via URL query parameters:

| Parameter | Description |
|---|---|
| `from` | Origin `lat,lng` (5 decimal places) |
| `to` | Destination `lat,lng` |
| `rnet` | `i` = IPPUC network; `o` = OSRM. Omitting with `from`/`to` present defaults to OSRM (legacy link) |
| `ciclovia` | Selected cycle path ID |
| `bairro` | Selected neighborhood |
| `tipo` | Path type filter |
| `seg` | Selected segment |
| `map` | Map theme (`dark`, `light`, `satellite`) |

`from` / `to` take priority over `ciclovia` / `bairro` on initial load.

## Routing Modes

### OSRM (road network)
Uses the `cycling` profile. Set `VITE_OSRM_URL` to your own OSRM instance if the public server returns `InvalidUrl` (profile not available). The app will display an error message in that case.

### IPPUC network (cycle paths only)
Follows the geometry of cycle paths loaded on the map. Works best with `VITE_CICLOVIAS_LIVE_URL` and endpoints snapped to the network. If no path is found, the app suggests switching to OSRM.

## Elevation

Elevation profiles are fetched from [Open-Elevation](https://open-elevation.com/) (SRTM data). Set `VITE_ELEVATION_URL` to use a self-hosted or alternative endpoint. The difficulty badge (Easy / Moderate / Hard) is calculated from elevation gain, routing mode, weather, and wind.

## Data Fallback

If `VITE_CICLOVIAS_LIVE_URL` is unset or the request fails, the app loads cycle path data from the static file `src/data/ciclovias.ts`.

## Getting Started

```bash
npm install
cp .env.example .env   # configure as needed
npm run dev            # starts on http://localhost:8080
```

### Other scripts

```bash
npm run build          # production build → dist/
npm run preview        # preview the production build locally
npm run lint           # run ESLint
npm run test           # run Vitest suite once
npm run test:watch     # Vitest in watch mode
```

## Deployment

The project is configured for [Vercel](https://vercel.com/). Push to your connected repository — Vercel runs `npm run build` and serves `dist/`. The `vercel.json` already includes all proxy rewrites and the SPA fallback (`/*` → `index.html`).
