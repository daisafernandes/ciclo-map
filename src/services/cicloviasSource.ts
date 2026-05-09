import type { LatLngExpression } from "leaflet";
import { ciclovias as staticCiclovias, type Ciclovia } from "@/data/ciclovias";
import { bairroNome } from "@/data/ippucBairros";

interface GeoJsonFeature {
  type: "Feature";
  geometry?: GeoJsonGeometry | null;
  properties?: Record<string, unknown> | null;
}

interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

type GeoJsonGeometry =
  | { type: "LineString"; coordinates: number[][] }
  | { type: "MultiLineString"; coordinates: number[][][] }
  | { type: "GeometryCollection"; geometries: GeoJsonGeometry[] };

export type CicloviasLoadMode = "static" | "live" | "static-fallback";

export interface CicloviasLoadResult {
  ciclovias: Ciclovia[];
  mode: CicloviasLoadMode;
}

const IPPUC_TIPO_LABEL: Record<number, string> = {
  0: "Descaracterizada",
  1: "Ciclovia",
  2: "Ciclofaixa",
  3: "Ciclofaixa (Via Calma)",
  4: "Ciclofaixa Sobre a Calçada",
  5: "Passeio Compartilhado",
  6: "Ciclorrota",
};

function mapIppucTipo(code: number | null | undefined): {
  type: Ciclovia["type"];
  tipoLabelIppuc: string;
} {
  const c = code ?? 0;
  const tipoLabelIppuc = IPPUC_TIPO_LABEL[c] ?? IPPUC_TIPO_LABEL[0];
  if (c === 1) return { type: "ciclovia", tipoLabelIppuc };
  if (c === 2 || c === 3 || c === 4 || c === 5) return { type: "ciclofaixa", tipoLabelIppuc };
  if (c === 6) return { type: "ciclorrota", tipoLabelIppuc };
  return { type: "ciclorrota", tipoLabelIppuc };
}

function inferSafety(type: Ciclovia["type"], ippucCode: number): Ciclovia["safety"] {
  if (ippucCode === 0) return "caution";
  if (type === "ciclovia") return "safe";
  if (type === "ciclofaixa") return "moderate";
  return "caution";
}

function lngLatRingToLeaflet(ring: number[][]): LatLngExpression[] {
  return ring.map(([lng, lat]) => [lat, lng] as LatLngExpression);
}

interface IppucProps {
  objectid?: number;
  nome?: string | null;
  ctba_tipo_ciclovia?: number | null;
  ctba_localizacao?: string | null;
  ctba_bairro?: number | null;
  lenght_km?: number | null;
}

function propsFromFeature(f: GeoJsonFeature): IppucProps {
  const p = (f.properties ?? {}) as Record<string, unknown>;
  return {
    objectid: typeof p.objectid === "number" ? p.objectid : undefined,
    nome: typeof p.nome === "string" || p.nome === null ? (p.nome as string | null) : undefined,
    ctba_tipo_ciclovia: typeof p.ctba_tipo_ciclovia === "number" ? p.ctba_tipo_ciclovia : null,
    ctba_localizacao:
      typeof p.ctba_localizacao === "string" || p.ctba_localizacao === null
        ? (p.ctba_localizacao as string | null)
        : undefined,
    ctba_bairro: typeof p.ctba_bairro === "number" ? p.ctba_bairro : null,
    lenght_km: typeof p.lenght_km === "number" ? p.lenght_km : null,
  };
}

function featureToCiclovias(f: GeoJsonFeature): Ciclovia[] {
  const g = f.geometry;
  if (!g || g.type === "GeometryCollection") return [];

  const props = propsFromFeature(f);
  const oid = props.objectid ?? 0;
  const ippucCode = props.ctba_tipo_ciclovia ?? 0;
  const { type, tipoLabelIppuc } = mapIppucTipo(ippucCode);
  const street = (props.ctba_localizacao ?? "").trim() || "Curitiba";
  const name = (props.nome ?? "").trim() || street;
  const neighborhood = bairroNome(props.ctba_bairro);
  const lengthKm = props.lenght_km ?? 0;

  const base: Omit<Ciclovia, "id" | "coordinates"> = {
    name,
    street,
    length: Math.round(lengthKm * 1000) / 1000,
    type,
    safety: inferSafety(type, ippucCode),
    avgTraffic: "medium",
    description: `Infraestrutura cicloviária municipal (${tipoLabelIppuc}). Fonte: IPPUC / GeoCuritiba.`,
    neighborhood,
    dataSource: "live",
    tipoLabelIppuc,
  };

  const lines = extractLineRings(g);
  if (lines.length === 0) return [];

  const perPart = lines.length > 1 ? lengthKm / lines.length : lengthKm;

  return lines.map((ring, idx) => ({
    ...base,
    id: lines.length > 1 ? `${oid}-${idx}` : String(oid),
    coordinates: lngLatRingToLeaflet(ring),
    length: Math.round(perPart * 1000) / 1000,
  }));
}

function extractLineRings(geometry: GeoJsonGeometry): number[][][] {
  if (geometry.type === "LineString") return [geometry.coordinates];
  if (geometry.type === "MultiLineString") return geometry.coordinates;
  return [];
}

function geoJsonToCiclovias(data: unknown): Ciclovia[] {
  const col = data as GeoJsonFeatureCollection;
  if (!col || col.type !== "FeatureCollection" || !Array.isArray(col.features)) {
    throw new Error("Resposta não é um FeatureCollection GeoJSON.");
  }
  const out: Ciclovia[] = [];
  for (const feature of col.features) {
    if (!feature || feature.type !== "Feature") continue;
    out.push(...featureToCiclovias(feature));
  }
  return out;
}

function withStaticSource(list: Ciclovia[]): Ciclovia[] {
  return list.map((c) => ({ ...c, dataSource: "static" as const }));
}

const CICLOVIAS_CACHE_NAME = "ciclovias-geojson-v1";
const CICLOVIAS_CACHE_KEY = "ciclovias-data-v1";

async function saveCicloviasToCache(data: unknown): Promise<void> {
  try {
    const cache = await caches.open(CICLOVIAS_CACHE_NAME);
    const response = new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
    await cache.put(CICLOVIAS_CACHE_KEY, response);
  } catch {
    // Cache API pode não estar disponível em contextos não-HTTPS.
  }
}

async function loadCicloviasFromCache(): Promise<unknown | null> {
  try {
    const cache = await caches.open(CICLOVIAS_CACHE_NAME);
    const res = await cache.match(CICLOVIAS_CACHE_KEY);
    if (!res) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

/**
 * Carrega ciclovias: estáticas por padrão; se `VITE_CICLOVIAS_LIVE_URL` estiver definida,
 * tenta GeoJSON (query ArcGIS ou arquivo). Em falha, tenta cache da Cache API,
 * depois volta ao estático.
 */
export async function loadCiclovias(): Promise<CicloviasLoadResult> {
  const staticWithSource = withStaticSource(staticCiclovias);
  const url = import.meta.env.VITE_CICLOVIAS_LIVE_URL?.trim();

  if (!url) {
    return { ciclovias: staticWithSource, mode: "static" };
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: unknown = await res.json();
    const live = geoJsonToCiclovias(data);
    if (live.length === 0) throw new Error("Nenhuma feição na resposta.");
    // Salva no cache para uso offline futuro.
    void saveCicloviasToCache(data);
    return { ciclovias: live, mode: "live" };
  } catch {
    // Tenta cache offline antes de usar dados estáticos.
    const cached = await loadCicloviasFromCache();
    if (cached) {
      try {
        const fromCache = geoJsonToCiclovias(cached);
        if (fromCache.length > 0) {
          return { ciclovias: fromCache, mode: "static-fallback" };
        }
      } catch {
        // Cache corrompido — cai no estático.
      }
    }
    return { ciclovias: staticWithSource, mode: "static-fallback" };
  }
}
