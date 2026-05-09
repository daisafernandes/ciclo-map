import type { LatLngTuple } from "leaflet";
import { osrmBase } from "@/lib/apiConfig";

export interface OsrmStep {
  maneuver: {
    type: string;
    modifier?: string;
    bearing_after: number;
  };
  name: string;
  distance: number;
  duration: number;
}

export interface OsrmRouteResult {
  /** Posições [lat, lng] para Leaflet. */
  positions: LatLngTuple[];
  distanceMeters: number;
  durationSeconds: number;
  /** Steps de navegação (apenas rotas OSRM com steps=true). */
  steps?: OsrmStep[];
}

/** Perfil fixo do app nos pedidos OSRM (rede para bicicleta em dados OSM). */
export const OSRM_APP_PROFILE = "cycling" as const;

function resolveOsrmProfile(options?: { profile?: string }): string {
  const o = options?.profile?.trim();
  if (o) return o;
  return OSRM_APP_PROFILE;
}

function osrmErrorMessage(code: string | undefined, message: string | undefined): string {
  const hintProfile =
    "O servidor OSRM público pode não expor o perfil de bicicleta. Use uma instância própria com dados OSM (perfil cycling) e defina VITE_OSRM_URL no .env.";
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

type OsrmApiStep = {
  maneuver: { type: string; modifier?: string; bearing_after: number };
  name: string;
  distance: number;
  duration: number;
};

type OsrmGeometryResponse = {
  code?: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: { type: string; coordinates?: [number, number][] };
    legs?: Array<{ steps?: OsrmApiStep[] }>;
  }>;
};

function geometryToPositions(route: NonNullable<OsrmGeometryResponse["routes"]>[0]): LatLngTuple[] {
  const coords = route.geometry?.coordinates;
  if (!coords?.length) {
    throw new Error("Geometria da rota vazia.");
  }
  return coords.map(([lng, lat]) => [lat, lng]);
}

function extractSteps(route: NonNullable<OsrmGeometryResponse["routes"]>[0]): OsrmStep[] {
  const steps: OsrmStep[] = [];
  for (const leg of route.legs ?? []) {
    for (const s of leg.steps ?? []) {
      steps.push({
        maneuver: {
          type: s.maneuver.type,
          modifier: s.maneuver.modifier,
          bearing_after: s.maneuver.bearing_after,
        },
        name: s.name,
        distance: s.distance,
        duration: s.duration,
      });
    }
  }
  return steps;
}

export type OsrmRoutingOptions = {
  /** Sobrescreve o perfil fixo do app (`cycling`) para esta chamada. */
  profile?: string;
};

/**
 * Uma ou mais rotas viárias (OSRM Route). Com **apenas origem e destino** pede até 3 alternativas
 * (`alternatives`), estilo apps de navegação. Com paradas intermediárias, o servidor costuma devolver uma única rota.
 */
export async function fetchOsrmRoutes(
  waypoints: LatLngTuple[],
  options?: OsrmRoutingOptions,
): Promise<OsrmRouteResult[]> {
  if (waypoints.length < 2) {
    throw new Error("São necessários pelo menos dois pontos.");
  }
  const profile = resolveOsrmProfile(options);
  const path = coordsPath(waypoints);
  const onlyAtoB = waypoints.length === 2;
  const altQs = onlyAtoB ? "&alternatives=3" : "";
  const url = `${osrmBase()}/route/v1/${profile}/${path}?overview=full&geometries=geojson&steps=true${altQs}`;

  const res = await fetch(url);
  const data = (await res.json()) as OsrmGeometryResponse;

  if (!res.ok) {
    const detail =
      typeof data.message === "string" && data.message.trim()
        ? data.message
        : `HTTP ${res.status}`;
    throw new Error(`OSRM: ${detail}`);
  }

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error(osrmErrorMessage(data.code, data.message));
  }

  return data.routes.map((route) => ({
    positions: geometryToPositions(route),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    steps: extractSteps(route),
  }));
}

/**
 * Rota viária passando por todos os pontos, na ordem informada (OSRM Route).
 * Equivalente à primeira opção de {@link fetchOsrmRoutes}.
 */
export async function fetchOsrmRoute(
  waypoints: LatLngTuple[],
  options?: OsrmRoutingOptions,
): Promise<OsrmRouteResult> {
  const routes = await fetchOsrmRoutes(waypoints, options);
  return routes[0];
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
export async function fetchOsrmTripRoute(
  waypoints: LatLngTuple[],
  options?: OsrmRoutingOptions,
): Promise<OsrmRouteResult & { optimizedPoints: LatLngTuple[] }> {
  if (waypoints.length < 2) {
    throw new Error("São necessários pelo menos dois pontos.");
  }
  const profile = resolveOsrmProfile(options);
  const path = coordsPath(waypoints);
  const url = `${osrmBase()}/trip/v1/${profile}/${path}?overview=full&geometries=geojson&roundtrip=false&source=first&destination=last`;

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
