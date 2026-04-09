import type { LatLngTuple } from "leaflet";

function nominatimBase(): string {
  const fromEnv = import.meta.env.VITE_NOMINATIM_URL?.replace(/\/$/, "");
  return fromEnv && fromEnv.length > 0 ? fromEnv : "/nominatim";
}

/** min_lon, max_lat, max_lon, min_lat — Curitiba e entorno. */
const CURITIBA_VIEWBOX = "-49.42,-25.38,-49.18,-25.55";

export interface ForwardGeocodeHit {
  lat: number;
  lon: number;
  displayName: string;
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  path?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  state?: string;
}

interface NominatimSearchItem {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: NominatimAddress;
  importance?: number;
  class?: string;
  type?: string;
}

/**
 * Extrai "trecho de logradouro" e número quando o utilizador escreve
 * p.ex. "nunes machado, 446" ou "Rua X, 1200".
 */
function parseStreetAndHouseNumber(input: string): { streetPart: string; house: string | null } {
  const t = input.trim();
  if (t.length < 2) return { streetPart: t, house: null };

  const commaHouse = t.match(/^(.+?),\s*(\d{1,6}[a-zA-Z]?)\s*$/);
  if (commaHouse) {
    const streetPart = commaHouse[1].trim();
    const house = commaHouse[2];
    if (streetPart.length >= 2) return { streetPart, house };
  }

  const spaceHouse = t.match(/^(.+?)\s+(\d{1,6}[a-zA-Z]?)$/);
  if (spaceHouse) {
    const before = spaceHouse[1].trim();
    const house = spaceHouse[2];
    if (before.length >= 4 && /[a-zA-ZÀ-ÿ]/.test(before) && !/^\d+$/.test(before.replace(/\s/g, ""))) {
      return { streetPart: before, house };
    }
  }

  return { streetPart: t, house: null };
}

/** Rótulo curto para UI; evita o display_name completo da OSM. */
function shortSearchLabel(item: NominatimSearchItem): string {
  const a = item.address;
  if (a) {
    const street = a.road || a.pedestrian || a.path || "";
    const num = (a.house_number || "").trim();
    const line1 = num && street ? `${street}, ${num}` : street || num;
    const area = a.neighbourhood || a.suburb || a.city || a.town || "";
    if (line1 && area) return `${line1} · ${area}`;
    if (line1) return line1;
    if (area) return area;
  }
  if (item.display_name) {
    return item.display_name
      .split(",")
      .map((s) => s.trim())
      .slice(0, 3)
      .join(", ");
  }
  return "";
}

/** Se o utilizador pediu um número e o resultado veio só ao nível da rua, mostrar o número no rótulo. */
function enrichLabelWithRequestedHouse(
  base: string,
  requestedHouse: string | null,
  item: NominatimSearchItem,
): string {
  if (!requestedHouse) return base;
  const fromApi = (item.address?.house_number || "").trim();
  if (fromApi && fromApi.replace(/\D/g, "") === requestedHouse.replace(/\D/g, "")) return base;
  if (base.includes(requestedHouse)) return base;
  const area = base.includes("·") ? base.split("·").slice(1).join("·").trim() : "";
  const streetOnly = item.address?.road || item.address?.pedestrian || item.address?.path || "";
  if (streetOnly) {
    const core = `${streetOnly}, ${requestedHouse}`;
    return area ? `${core} · ${area}` : core;
  }
  return `${base} · nº ${requestedHouse}`;
}

function withCuritibaBias(raw: string): string {
  const q = raw.trim();
  if (q.length < 2) return q;
  if (/\bcuritiba\b|\bctba\b/i.test(q)) return q;
  if (/,\s*(pr|paraná|parana)\b/i.test(q)) return q;
  return `${q}, Curitiba`;
}

function scoreResult(item: NominatimSearchItem, requestedHouse: string | null): number {
  let s = item.importance ?? 0;
  const hn = (item.address?.house_number || "").trim();
  if (requestedHouse && hn && hn.replace(/\D/g, "") === requestedHouse.replace(/\D/g, "")) {
    s += 0.5;
  }
  if (requestedHouse && (item.class === "place" || item.type === "house")) {
    s += 0.15;
  }
  if (item.class === "building") s += 0.1;
  return s;
}

async function fetchNominatim(
  params: URLSearchParams,
  signal: AbortSignal | undefined,
): Promise<NominatimSearchItem[]> {
  const base = nominatimBase();
  const url = `${base}/search?${params.toString()}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const raw = (await res.json()) as NominatimSearchItem[];
  return Array.isArray(raw) ? raw : [];
}

function dedupeItems(items: NominatimSearchItem[]): NominatimSearchItem[] {
  const seen = new Map<string, NominatimSearchItem>();
  for (const item of items) {
    const lat = item.lat != null ? Number(item.lat) : NaN;
    const lon = item.lon != null ? Number(item.lon) : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
    const prev = seen.get(key);
    if (!prev || (item.importance ?? 0) > (prev.importance ?? 0)) {
      seen.set(key, item);
    }
  }
  return [...seen.values()];
}

/**
 * Busca de endereço (Nominatim), com tentativa estruturada rua+número+Curitiba quando há número na pesquisa.
 */
export async function forwardGeocode(
  query: string,
  signal?: AbortSignal,
): Promise<ForwardGeocodeHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const { streetPart, house } = parseStreetAndHouseNumber(q);
  const qSearch = withCuritibaBias(q);

  function baseParams(): URLSearchParams {
    const p = new URLSearchParams();
    p.set("format", "json");
    p.set("accept-language", "pt-BR");
    p.set("limit", "8");
    p.set("addressdetails", "1");
    p.set("bounded", "0");
    p.set("viewbox", CURITIBA_VIEWBOX);
    p.set("countrycodes", "br");
    p.set("dedupe", "1");
    return p;
  }

  const tasks: Promise<NominatimSearchItem[]>[] = [];

  const free = baseParams();
  free.set("q", qSearch);
  tasks.push(fetchNominatim(free, signal));

  if (house && streetPart.length >= 2) {
    const norm =
      /^(rua|av\.?|avenida|alameda|trav\.?|travessa|rod\.?|estrada)\s+/i.test(streetPart.trim())
        ? streetPart.trim()
        : `Rua ${streetPart.trim()}`;
    const streetVariants = [`${norm}, ${house}`, `${streetPart.trim()}, ${house}`];
    for (const street of streetVariants) {
      const st = baseParams();
      st.set("street", street);
      st.set("city", "Curitiba");
      st.set("state", "Paraná");
      st.set("country", "Brazil");
      tasks.push(fetchNominatim(st, signal));
    }
  }

  const batches = await Promise.all(tasks);
  let merged = dedupeItems(batches.flat());

  merged.sort((a, b) => scoreResult(b, house) - scoreResult(a, house));

  if (merged.length > 8) merged = merged.slice(0, 8);

  const out: ForwardGeocodeHit[] = [];
  for (const item of merged) {
    const lat = item.lat != null ? Number(item.lat) : NaN;
    const lon = item.lon != null ? Number(item.lon) : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const short = shortSearchLabel(item).trim();
    const base = short || item.display_name?.trim() || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    const displayName = enrichLabelWithRequestedHouse(base, house, item);
    out.push({ lat, lon, displayName });
  }
  return out;
}

export function hitToLatLng(hit: ForwardGeocodeHit): LatLngTuple {
  return [hit.lat, hit.lon];
}
