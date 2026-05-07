import type { LatLngTuple } from "leaflet";
import { nominatimBase } from "@/lib/apiConfig";

const cache = new Map<string, string>();

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

interface NominatimAddr {
  road?: string;
  pedestrian?: string;
  path?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
}

interface NominatimReverse {
  display_name?: string;
  address?: NominatimAddr;
}

function shortLabel(data: NominatimReverse): string {
  const a = data.address;
  if (a) {
    const street = a.road || a.pedestrian || a.path || "";
    const area = a.neighbourhood || a.suburb || a.city || a.town || "";
    const parts = [street, area].filter(Boolean);
    if (parts.length) return parts.join(" · ");
  }
  if (data.display_name) {
    return data.display_name
      .split(",")
      .map((s) => s.trim())
      .slice(0, 3)
      .join(", ");
  }
  return "";
}

/** Resolve endereço aproximado (Nominatim / OSM). Usa proxy /nominatim em dev e produção. */
export async function reverseGeocodePoint(
  p: LatLngTuple,
  signal?: AbortSignal,
): Promise<string | null> {
  const [lat, lon] = p;
  const key = cacheKey(lat, lon);
  const hit = cache.get(key);
  if (hit) return hit;

  const base = nominatimBase();
  const url = `${base}/reverse?format=json&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&accept-language=pt-BR`;

  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as NominatimReverse;
  const label = shortLabel(data);
  if (label) cache.set(key, label);
  return label || null;
}
