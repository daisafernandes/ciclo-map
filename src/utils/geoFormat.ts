import type { LatLngTuple } from "leaflet";

export function formatLatLngTuple(p: LatLngTuple, digits = 4): string {
  return `${p[0].toFixed(digits)}, ${p[1].toFixed(digits)}`;
}

/** Remove diacríticos e converte para minúsculas para comparação/slug. */
export function normalizeText(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}
