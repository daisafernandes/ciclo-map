import type { LatLngTuple } from "leaflet";

const R = 6371000;

function haversineM(a: LatLngTuple, b: LatLngTuple): number {
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

/** Amostra ao longo da polyline para não exceder limites da API. */
export function sampleRoutePositions(positions: LatLngTuple[], maxPoints: number): LatLngTuple[] {
  if (positions.length === 0) return [];
  if (positions.length <= maxPoints) return positions;
  const step = (positions.length - 1) / (maxPoints - 1);
  const out: LatLngTuple[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.min(positions.length - 1, Math.round(i * step));
    out.push(positions[idx]);
  }
  return out;
}

export interface ElevationProfilePoint {
  distanceKm: number;
  elevationM: number;
}

/**
 * Perfil de elevação ao longo da rota (Open-Elevation, dados SRTM).
 * Pode falhar por rede, CORS ou cota; use apenas como referência aproximada.
 */
export async function fetchElevationProfile(
  positions: LatLngTuple[],
  maxSamples = 80,
): Promise<ElevationProfilePoint[]> {
  const samples = sampleRoutePositions(positions, maxSamples);
  if (samples.length === 0) return [];

  const distM: number[] = [0];
  for (let i = 1; i < samples.length; i++) {
    distM.push(distM[i - 1] + haversineM(samples[i - 1], samples[i]));
  }

  const base =
    import.meta.env.VITE_ELEVATION_URL?.trim().replace(/\/$/, "") ||
    "https://api.open-elevation.com/api/v1/lookup";

  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locations: samples.map(([lat, lng]) => ({ latitude: lat, longitude: lng })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Elevação: HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    results?: Array<{ elevation?: number }>;
  };

  const results = data.results;
  if (!results?.length || results.length !== samples.length) {
    throw new Error("Resposta de elevação inválida.");
  }

  return results.map((r, i) => ({
    distanceKm: distM[i] / 1000,
    elevationM: typeof r.elevation === "number" && Number.isFinite(r.elevation) ? r.elevation : 0,
  }));
}
