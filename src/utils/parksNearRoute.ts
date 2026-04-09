import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson";
import type { LatLngTuple } from "leaflet";
import { distPointToPolylineM } from "@/utils/geoDistance";

function polygonCentroid(g: Polygon): LatLngTuple | null {
  const ring = g.coordinates[0];
  if (!ring?.length) return null;
  let lat = 0;
  let lng = 0;
  const n = ring.length - 1;
  for (let i = 0; i < n; i++) {
    lng += ring[i][0];
    lat += ring[i][1];
  }
  return [lat / n, lng / n];
}

function featureCentroid(f: Feature<Geometry>): LatLngTuple | null {
  const g = f.geometry;
  if (g.type === "Polygon") return polygonCentroid(g);
  if (g.type === "MultiPolygon") {
    let best: LatLngTuple | null = null;
    let bestArea = -1;
    for (const poly of (g as MultiPolygon).coordinates) {
      const ring = poly[0];
      if (!ring?.length) continue;
      let area = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        const [x1, y1] = ring[i];
        const [x2, y2] = ring[i + 1];
        area += x1 * y2 - x2 * y1;
      }
      area = Math.abs(area / 2);
      if (area > bestArea) {
        bestArea = area;
        best = polygonCentroid({ type: "Polygon", coordinates: poly });
      }
    }
    return best;
  }
  return null;
}

function parkLabel(props: Record<string, unknown> | null | undefined): string {
  if (!props) return "Parque";
  const name =
    (typeof props.name === "string" && props.name) ||
    (typeof props["name:pt"] === "string" && props["name:pt"]) ||
    (typeof props["name:en"] === "string" && props["name:en"]);
  return name || "Parque";
}

export interface ParkNearRouteSuggestion {
  id: string;
  name: string;
  distanceM: number;
}

/**
 * Parques grandes (polígonos OSM) cuja distância ao trajeto é menor que o limite.
 */
export function suggestParksNearRoute(
  routeLine: LatLngTuple[],
  parks: FeatureCollection<Geometry>,
  opts?: { maxResults?: number; maxDistanceM?: number },
): ParkNearRouteSuggestion[] {
  const maxResults = opts?.maxResults ?? 5;
  const maxDistanceM = opts?.maxDistanceM ?? 450;
  if (routeLine.length < 2 || parks.features.length === 0) return [];

  const scored: ParkNearRouteSuggestion[] = [];

  parks.features.forEach((f, idx) => {
    const c = featureCentroid(f as Feature<Geometry>);
    if (!c) return;
    const d = distPointToPolylineM(c, routeLine);
    if (d > maxDistanceM) return;
    const props = (f.properties ?? undefined) as Record<string, unknown> | undefined;
    const id =
      (props && typeof props.id === "string" && props.id) ||
      (props && typeof props["@id"] === "string" && props["@id"]) ||
      `park-${idx}`;
    scored.push({ id, name: parkLabel(props), distanceM: Math.round(d) });
  });

  scored.sort((a, b) => a.distanceM - b.distanceM);
  return scored.slice(0, maxResults);
}
