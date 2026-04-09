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

function osrmErrorMessage(code: string | undefined, message: string | undefined): string {
  const hintProfile =
    "O servidor OSRM pode não expor este perfil (o público costuma aceitar só “driving”). Use uma instância própria com dados OSM e defina VITE_OSRM_PROFILE no .env, ou volte ao perfil padrão.";
  if (code === "InvalidUrl" || code === "InvalidQuery") {
    return `Pedido inválido ao OSRM (${code}). ${hintProfile}`;
  }
  if (code === "NoRoute" || code === "NoSegment" || code === "NoTrips") {
    return "Rota não encontrada entre os pontos (rede ou cobertura).";
  }
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }
  return "Não foi possível calcular a rota.";
}

function coordsPath(waypoints: LatLngTuple[]): string {
  return waypoints.map(([lat, lon]) => `${lon},${lat}`).join(";");
}

type OsrmGeometryResponse = {
  code?: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: { type: string; coordinates?: [number, number][] };
  }>;
};

function geometryToPositions(route: NonNullable<OsrmGeometryResponse["routes"]>[0]): LatLngTuple[] {
  const coords = route.geometry?.coordinates;
  if (!coords?.length) {
    throw new Error("Geometria da rota vazia.");
  }
  return coords.map(([lng, lat]) => [lat, lng]);
}

/**
 * Rota viária passando por todos os pontos, na ordem informada (OSRM Route).
 */
export async function fetchOsrmRoute(waypoints: LatLngTuple[]): Promise<OsrmRouteResult> {
  if (waypoints.length < 2) {
    throw new Error("São necessários pelo menos dois pontos.");
  }
  const profile = osrmProfile();
  const path = coordsPath(waypoints);
  const url = `${osrmBaseUrl()}/route/v1/${profile}/${path}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  const data = (await res.json()) as OsrmGeometryResponse;

  if (!res.ok) {
    const detail =
      typeof data.message === "string" && data.message.trim()
        ? data.message
        : `HTTP ${res.status}`;
    throw new Error(`OSRM: ${detail}`);
  }

  if (data.code !== "Ok" || !data.routes?.[0]) {
    throw new Error(osrmErrorMessage(data.code, data.message));
  }

  const route = data.routes[0];
  const positions = geometryToPositions(route);

  return {
    positions,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}

interface OsrmTripResponse {
  code?: string;
  message?: string;
  trips?: Array<{
    distance: number;
    duration: number;
    geometry?: { type: string; coordinates?: [number, number][] };
  }>;
  waypoints?: Array<{ location?: [number, number] }>;
}

/**
 * Trip otimizado com primeiro ponto como origem e último como destino (meio reordenado).
 * Retorna geometria e a ordem sugerida dos waypoints (para atualizar marcadores).
 */
export async function fetchOsrmTripRoute(waypoints: LatLngTuple[]): Promise<
  OsrmRouteResult & { optimizedPoints: LatLngTuple[] }
> {
  if (waypoints.length < 2) {
    throw new Error("São necessários pelo menos dois pontos.");
  }
  const profile = osrmProfile();
  const path = coordsPath(waypoints);
  const url = `${osrmBaseUrl()}/trip/v1/${profile}/${path}?overview=full&geometries=geojson&roundtrip=false&source=first&destination=last`;

  const res = await fetch(url);
  const data = (await res.json()) as OsrmTripResponse;

  if (!res.ok) {
    const detail =
      typeof data.message === "string" && data.message.trim()
        ? data.message
        : `HTTP ${res.status}`;
    throw new Error(`OSRM: ${detail}`);
  }

  if (data.code !== "Ok" || !data.trips?.[0]) {
    throw new Error(osrmErrorMessage(data.code, data.message));
  }

  const trip = data.trips[0];
  const positions = geometryToPositions(trip);

  const optimizedPoints: LatLngTuple[] =
    data.waypoints
      ?.map((w) => w.location)
      .filter((loc): loc is [number, number] => Array.isArray(loc) && loc.length >= 2)
      .map(([lon, lat]) => [lat, lon]) ?? waypoints;

  return {
    positions,
    distanceMeters: trip.distance,
    durationSeconds: trip.duration,
    optimizedPoints,
  };
}
