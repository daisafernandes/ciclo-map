import type { LatLngTuple } from "leaflet";
import type { Ciclovia } from "@/data/ciclovias";

/** Rota calculada por OSRM (rede viária) ou apenas pela rede IPPUC desenhada no mapa. */
export type RouteNetworkMode = "osrm" | "ippuc";

/** `i` = rede IPPUC; `o` = OSRM (explícito em URLs com rota). */
export function parseRouteNetworkMode(raw: string | null): RouteNetworkMode {
  if (raw === "i" || raw === "ippuc") return "ippuc";
  if (raw === "o" || raw === "osrm") return "osrm";
  return "osrm";
}

/** Compacto para `rnet`: sempre `i` ou `o` quando a rota é serializada na URL. */
export function encodeRouteNetworkMode(mode: RouteNetworkMode): "i" | "o" {
  return mode === "ippuc" ? "i" : "o";
}

export type BaseLayerId = "dark" | "light" | "satellite";

/** Precisão ~1 m; compacta para URLs compartilháveis. */
const ROUTE_LL_DECIMALS = 5;

/**
 * Codifica um ponto para o parâmetro de URL `from` ou `to` (`lat,lng`).
 */
export function encodeRoutePoint(p: LatLngTuple): string {
  return `${p[0].toFixed(ROUTE_LL_DECIMALS)},${p[1].toFixed(ROUTE_LL_DECIMALS)}`;
}

/**
 * Decodifica `lat,lng` da URL. Rejeita coordenadas fora dos intervalos válidos.
 */
export function decodeRoutePoint(raw: string | null): LatLngTuple | null {
  if (!raw?.trim()) return null;
  const parts = raw.split(",").map((s) => s.trim());
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

/** Vários pontos na URL: `lat,lng;lat,lng;...` (ponto e vírgula entre trechos). */
export function encodeRouteWaypoints(points: LatLngTuple[]): string | null {
  if (points.length < 2) return null;
  return points.map((p) => encodeRoutePoint(p)).join(";");
}

export function decodeRouteWaypoints(raw: string | null): LatLngTuple[] | null {
  if (!raw?.trim()) return null;
  const chunks = raw.split(";").map((s) => s.trim()).filter(Boolean);
  if (chunks.length < 2) return null;
  const out: LatLngTuple[] = [];
  for (const ch of chunks) {
    const p = decodeRoutePoint(ch);
    if (!p) return null;
    out.push(p);
  }
  return out;
}

const TYPE_ORDER: Ciclovia["type"][] = ["ciclovia", "ciclofaixa", "ciclorrota"];
const TYPE_LETTER: Record<Ciclovia["type"], string> = {
  ciclovia: "c",
  ciclofaixa: "f",
  ciclorrota: "r",
};

const SAFETY_ORDER: Ciclovia["safety"][] = ["safe", "moderate", "caution"];
const SAFETY_LETTER: Record<Ciclovia["safety"], string> = {
  safe: "s",
  moderate: "m",
  caution: "a",
};

const DEFAULT_TYPE: Record<Ciclovia["type"], boolean> = {
  ciclovia: true,
  ciclofaixa: true,
  ciclorrota: true,
};

const DEFAULT_SAFETY: Record<Ciclovia["safety"], boolean> = {
  safe: true,
  moderate: true,
  caution: true,
};

export function encodeTypeFilter(filter: Record<Ciclovia["type"], boolean>): string | null {
  const letters = TYPE_ORDER.filter((k) => filter[k]).map((k) => TYPE_LETTER[k]);
  const all = TYPE_ORDER.every((k) => filter[k]);
  if (all) return null;
  return letters.join("");
}

export function decodeTypeFilter(param: string | null): Record<Ciclovia["type"], boolean> {
  if (!param?.trim()) return { ...DEFAULT_TYPE };
  const set = new Set(param.toLowerCase().split(""));
  const next = { ...DEFAULT_TYPE };
  for (const t of TYPE_ORDER) {
    next[t] = set.has(TYPE_LETTER[t]);
  }
  const anyOn = TYPE_ORDER.some((k) => next[k]);
  if (!anyOn) return { ...DEFAULT_TYPE };
  return next;
}

export function encodeSafetyFilter(filter: Record<Ciclovia["safety"], boolean>): string | null {
  const letters = SAFETY_ORDER.filter((k) => filter[k]).map((k) => SAFETY_LETTER[k]);
  const all = SAFETY_ORDER.every((k) => filter[k]);
  if (all) return null;
  return letters.join("");
}

export function decodeSafetyFilter(param: string | null): Record<Ciclovia["safety"], boolean> {
  if (!param?.trim()) return { ...DEFAULT_SAFETY };
  const set = new Set(param.toLowerCase().split(""));
  const next = { ...DEFAULT_SAFETY };
  for (const s of SAFETY_ORDER) {
    next[s] = set.has(SAFETY_LETTER[s]);
  }
  const anyOn = SAFETY_ORDER.some((k) => next[k]);
  if (!anyOn) return { ...DEFAULT_SAFETY };
  return next;
}

export function parseBaseLayer(raw: string | null): BaseLayerId {
  if (raw === "light" || raw === "satellite") return raw;
  return "dark";
}

export function baseLayerToParam(id: BaseLayerId): string | null {
  return id === "dark" ? null : id;
}
