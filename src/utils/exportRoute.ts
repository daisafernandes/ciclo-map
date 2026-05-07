import type { LatLngExpression } from "leaflet";
import type { Feature, LineString } from "geojson";
import type { Ciclovia } from "@/data/ciclovias";
import { toLatLngTuple } from "@/utils/geoDistance";
import { normalizeText } from "@/utils/geoFormat";

/** Slug seguro para nome de arquivo (nome ou id). */
export function routeFileSlug(ciclovia: Ciclovia): string {
  const base = ciclovia.name?.trim() || ciclovia.id;
  const slug = normalizeText(base).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || `trecho-${ciclovia.id}`;
}

/** Coordenadas como tuplas [lat, lng] na ordem do mapa. */
export function cicloviaLineLatLng(ciclovia: Ciclovia): [number, number][] {
  return ciclovia.coordinates.map((p) => toLatLngTuple(p as LatLngExpression));
}

/** GeoJSON LineString (RFC 7946: [lng, lat]). */
export function cicloviaToGeoJsonFeature(ciclovia: Ciclovia): Feature<LineString> {
  const line = cicloviaLineLatLng(ciclovia).map(([lat, lng]) => [lng, lat] as [number, number]);
  return {
    type: "Feature",
    properties: {
      id: ciclovia.id,
      name: ciclovia.name,
      lengthKm: ciclovia.length,
      type: ciclovia.type,
      safety: ciclovia.safety,
      neighborhood: ciclovia.neighborhood,
    },
    geometry: {
      type: "LineString",
      coordinates: line,
    },
  };
}

export function cicloviaToGeoJsonString(ciclovia: Ciclovia, pretty = true): string {
  const fc = {
    type: "FeatureCollection" as const,
    features: [cicloviaToGeoJsonFeature(ciclovia)],
  };
  return pretty ? JSON.stringify(fc, null, 2) : JSON.stringify(fc);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** GPX 1.1 mínimo com um track e segmento de pontos. */
export function cicloviaToGpxXml(ciclovia: Ciclovia): string {
  const pts = cicloviaLineLatLng(ciclovia);
  const name = escapeXml(ciclovia.name);
  const trkpts = pts
    .map(([lat, lng]) => `    <trkpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}" />`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="CicloMap CWB" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${name}</name></metadata>
  <trk>
    <name>${name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;
}

export function downloadBlob(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCicloviaGeoJson(ciclovia: Ciclovia): void {
  const slug = routeFileSlug(ciclovia);
  downloadBlob(`${slug}.geojson`, cicloviaToGeoJsonString(ciclovia), "application/geo+json");
}

export function downloadCicloviaGpx(ciclovia: Ciclovia): void {
  const slug = routeFileSlug(ciclovia);
  downloadBlob(`${slug}.gpx`, cicloviaToGpxXml(ciclovia), "application/gpx+xml");
}
