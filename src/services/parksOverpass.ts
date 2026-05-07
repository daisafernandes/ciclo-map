import area from "@turf/area";
import osmtogeojson from "osmtogeojson";
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson";
import { overpassBase } from "@/lib/apiConfig";

/** Área mínima em m² para contar como "parque grande" (~9 ha). Praças e ilhéus pequenos ficam de fora. */
export const MIN_LARGE_PARK_AREA_M2 = 90_000;

/** Área aproximada de Curitiba (WGS84) para consulta de parques no OSM. */
export const CURITIBA_PARKS_BBOX = {
  south: -25.65,
  west: -49.42,
  north: -25.25,
  east: -48.98,
} as const;

function filterLargeParksOnly(fc: FeatureCollection<Geometry>): FeatureCollection<Geometry> {
  const features = fc.features.filter((f) => {
    const g = f.geometry;
    if (g.type !== "Polygon" && g.type !== "MultiPolygon") return false;
    return area(f as Feature<Polygon | MultiPolygon>) >= MIN_LARGE_PARK_AREA_M2;
  });
  return { type: "FeatureCollection", features };
}

/**
 * Parques e áreas de recreação (`leisure=park`, `landuse=recreation_ground`) via Overpass API.
 * Depois do GeoJSON, mantém só polígonos com área ≥ {@link MIN_LARGE_PARK_AREA_M2} m².
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

  const res = await fetch(overpassBase(), {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!res.ok) {
    throw new Error(`Overpass HTTP ${res.status}`);
  }

  const osm: unknown = await res.json();
  const geojson = osmtogeojson(osm as Parameters<typeof osmtogeojson>[0]);
  return filterLargeParksOnly(geojson as FeatureCollection<Geometry>);
}
