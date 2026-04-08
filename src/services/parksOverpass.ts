import osmtogeojson from "osmtogeojson";
import type { FeatureCollection, Geometry } from "geojson";

/** Área aproximada de Curitiba (WGS84) para consulta de parques no OSM. */
export const CURITIBA_PARKS_BBOX = {
  south: -25.65,
  west: -49.42,
  north: -25.25,
  east: -48.98,
} as const;

function overpassUrl(): string {
  const fromEnv = import.meta.env.VITE_OVERPASS_URL?.trim();
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return "/overpass-api/api/interpreter";
  return "https://overpass-api.de/api/interpreter";
}

/**
 * Parques e áreas de recreação (`leisure=park`, `landuse=recreation_ground`) via Overpass API.
 * Fonte: OpenStreetMap (mesma base dos tiles).
 */
export async function fetchCuritibaParksGeoJson(): Promise<FeatureCollection<Geometry>> {
  const { south, west, north, east } = CURITIBA_PARKS_BBOX;
  const query = `
[out:json][timeout:90];
(
  way["leisure"="park"](${south},${west},${north},${east});
  relation["leisure"="park"](${south},${west},${north},${east});
  way["landuse"="recreation_ground"](${south},${west},${north},${east});
);
out geom;
`;

  const res = await fetch(overpassUrl(), {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!res.ok) {
    throw new Error(`Overpass HTTP ${res.status}`);
  }

  const osm: unknown = await res.json();
  const geojson = osmtogeojson(osm as Parameters<typeof osmtogeojson>[0]);
  return geojson as FeatureCollection<Geometry>;
}
