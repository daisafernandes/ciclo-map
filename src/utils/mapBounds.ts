import L, { LatLngExpression, LatLngTuple } from "leaflet";
import type { Ciclovia } from "@/data/ciclovias";

export function flattenBoundsPoints(ciclovias: Ciclovia[]): LatLngTuple[] {
  const pts: LatLngTuple[] = [];
  for (const c of ciclovias) {
    for (const p of c.coordinates) {
      if (Array.isArray(p) && p.length >= 2) {
        const [a, b] = p;
        if (typeof a === "number" && typeof b === "number") pts.push([a, b]);
      }
    }
  }
  return pts;
}

function cross2(o: LatLngTuple, a: LatLngTuple, b: LatLngTuple): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function paddedBoxAroundPoints(pts: LatLngTuple[], pad: number): LatLngTuple[] {
  const lats = pts.map((p) => p[0]);
  const lngs = pts.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return [
    [minLat - pad, minLng - pad],
    [minLat - pad, maxLng + pad],
    [maxLat + pad, maxLng + pad],
    [maxLat + pad, minLng - pad],
  ];
}

/** Fecho convexo (cadeia monotônica) em plano lat/lng — contorno irregular em torno dos trechos. */
export function convexHull(points: LatLngTuple[]): LatLngTuple[] {
  const uniq = [...new Map(points.map((p) => [`${p[0]},${p[1]}`, p] as const)).values()];
  if (uniq.length <= 1) return uniq;
  uniq.sort((p, q) => (p[0] === q[0] ? p[1] - q[1] : p[0] - q[0]));

  const pad = 0.00035;
  if (uniq.length === 2) {
    return paddedBoxAroundPoints(uniq, pad);
  }

  const lower: LatLngTuple[] = [];
  for (const p of uniq) {
    while (lower.length >= 2 && cross2(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: LatLngTuple[] = [];
  for (let i = uniq.length - 1; i >= 0; i--) {
    const p = uniq[i]!;
    while (upper.length >= 2 && cross2(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  if (hull.length >= 3) return hull;
  return paddedBoxAroundPoints(uniq, pad);
}

/** Polígono que envolve os pontos das ciclovias (fecho convexo + fallback para 1 ponto). */
export function outlinePolygonFromCiclovias(ciclovias: Ciclovia[]): LatLngTuple[] | null {
  const pts = flattenBoundsPoints(ciclovias);
  if (pts.length === 0) return null;
  if (pts.length === 1) {
    const p = pts[0]!;
    const d = 0.0004;
    return [
      [p[0] - d, p[1] - d],
      [p[0] - d, p[1] + d],
      [p[0] + d, p[1] + d],
      [p[0] + d, p[1] - d],
    ];
  }
  return convexHull(pts);
}

export function boundsFromCiclovias(ciclovias: Ciclovia[]): L.LatLngBounds | null {
  const pts = flattenBoundsPoints(ciclovias);
  if (pts.length === 0) return null;
  return L.latLngBounds(pts);
}

/** Contorno do destaque de bairro (polígono) + bounds para o mapa encaixar a área. */
export function neighborhoodHighlightShape(ciclovias: Ciclovia[]): {
  outline: LatLngTuple[];
  bounds: L.LatLngBounds;
} | null {
  const outline = outlinePolygonFromCiclovias(ciclovias);
  if (!outline?.length) return null;
  return { outline, bounds: L.latLngBounds(outline) };
}

export function midpoint(ciclovia: Ciclovia): LatLngExpression {
  const mid = Math.floor(ciclovia.coordinates.length / 2);
  return ciclovia.coordinates[mid];
}
