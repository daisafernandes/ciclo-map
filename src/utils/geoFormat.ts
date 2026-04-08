import type { LatLngTuple } from "leaflet";

export function formatLatLngTuple(p: LatLngTuple, digits = 4): string {
  return `${p[0].toFixed(digits)}, ${p[1].toFixed(digits)}`;
}
