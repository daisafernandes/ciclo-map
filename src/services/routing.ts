import type { LatLngTuple } from "leaflet";

export interface OsrmRouteResult {
  /** Posições [lat, lng] para Leaflet. */
  positions: LatLngTuple[];
  distanceMeters: number;
  durationSeconds: number;
}

function osrmBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_OSRM_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "/osrm";
}

/**
 * Perfil OSRM. O demo público `router.project-osrm.org` costuma expor só `driving`;
 * perfis como `cycling` podem responder com `InvalidUrl`. Sobrescreva com
 * `VITE_OSRM_PROFILE` se usar instância própria com dados bike/foot.
 */
function osrmProfile(): string {
  const p = import.meta.env.VITE_OSRM_PROFILE?.trim();
  if (p) return p;
  return "driving";
}

/**
 * Rota viária aproximada (OSRM).
 * Em dev/produção com proxy `/osrm` → `router.project-osrm.org` (evita CORS).
 * Pode falhar fora da cobertura ou sob carga no servidor público.
 */
export async function fetchOsrmRoute(from: LatLngTuple, to: LatLngTuple): Promise<OsrmRouteResult> {
  const [lat1, lon1] = from;
  const [lat2, lon2] = to;
  const path = `${lon1},${lat1};${lon2},${lat2}`;
  const profile = osrmProfile();
  const url = `${osrmBaseUrl()}/route/v1/${profile}/${path}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OSRM HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    code?: string;
    routes?: Array<{
      distance: number;
      duration: number;
      geometry?: { type: string; coordinates?: [number, number][] };
    }>;
  };

  if (data.code !== "Ok" || !data.routes?.[0]) {
    throw new Error("Rota não encontrada entre os pontos.");
  }

  const route = data.routes[0];
  const coords = route.geometry?.coordinates;
  if (!coords?.length) {
    throw new Error("Geometria da rota vazia.");
  }

  const positions: LatLngTuple[] = coords.map(([lng, lat]) => [lat, lng]);

  return {
    positions,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}
