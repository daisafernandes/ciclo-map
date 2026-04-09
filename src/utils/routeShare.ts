import type { RouteNetworkMode } from "@/utils/mapUrlParams";

interface FormatRouteShareMessageParams {
  labelA: string | null;
  labelB: string | null;
  waypointCount: number;
  distanceMeters: number;
  durationSeconds: number;
  routeNetworkMode: RouteNetworkMode;
  absoluteUrl: string;
}

function formatRouteModeLabel(routeNetworkMode: RouteNetworkMode): string {
  return routeNetworkMode === "ippuc" ? "Rede cicloviária (IPPUC)" : "Rede viária (OSRM)";
}

export function formatRouteShareMessage({
  labelA,
  labelB,
  waypointCount,
  distanceMeters,
  durationSeconds,
  routeNetworkMode,
  absoluteUrl,
}: FormatRouteShareMessageParams): string {
  const origin = labelA?.trim() || "Origem";
  const destination = labelB?.trim() || "Destino";
  const distanceKm = (distanceMeters / 1000).toFixed(2);
  const durationMinutes = Math.round(durationSeconds / 60);
  const mapUrl = absoluteUrl.trim();

  const lines = [
    "CicloMap CWB",
    `${origin} → ${destination}`,
    ...(waypointCount > 0 ? [`Paradas intermediárias: ${waypointCount}`] : []),
    `Distância: ${distanceKm} km`,
    `Tempo estimado: ${durationMinutes} min`,
    `Modo de rota: ${formatRouteModeLabel(routeNetworkMode)}`,
    "Abrir no mapa:",
    "",
    mapUrl,
  ];

  return lines.join("\n");
}

export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
