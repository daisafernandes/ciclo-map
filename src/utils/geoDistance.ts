import type { LatLngTuple } from "leaflet";

const R = 6371000;

/** Distância em metros entre dois pontos (fórmula de Haversine). */
export function haversineM(a: LatLngTuple, b: LatLngTuple): number {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

/** Distância aproximada do ponto ao segmento AB (área local ~Curitiba). */
export function distPointToSegmentM(p: LatLngTuple, a: LatLngTuple, b: LatLngTuple): number {
  const [lat, lng] = p;
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-18) return haversineM(p, a);
  let t = ((lng - lng1) * dx + (lat - lat1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const proj: LatLngTuple = [lat1 + t * dy, lng1 + t * dx];
  return haversineM(p, proj);
}

/** Projeção de P no segmento AB (corda em lat/lng) e distância em metros. */
export function projectPointOnChordSegment(
  p: LatLngTuple,
  a: LatLngTuple,
  b: LatLngTuple,
): { point: LatLngTuple; distM: number } {
  const [lat, lng] = p;
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-18) {
    const pt = a;
    return { point: pt, distM: haversineM(p, pt) };
  }
  let t = ((lng - lng1) * dx + (lat - lat1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const point: LatLngTuple = [lat1 + t * dy, lng1 + t * dx];
  return { point, distM: haversineM(p, point) };
}

export function distPointToPolylineM(p: LatLngTuple, line: LatLngTuple[]): number {
  if (line.length === 0) return Infinity;
  if (line.length === 1) return haversineM(p, line[0]);
  let min = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const d = distPointToSegmentM(p, line[i], line[i + 1]);
    if (d < min) min = d;
  }
  return min;
}
