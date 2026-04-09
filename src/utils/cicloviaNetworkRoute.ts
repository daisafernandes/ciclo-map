import type { LatLngTuple } from "leaflet";
import type { LatLngExpression } from "leaflet";
import type { Ciclovia } from "@/data/ciclovias";
import { haversineM, projectPointOnChordSegment } from "@/utils/geoDistance";

/** Trecho reta entre o ponto do usuário e o encosto na rede (visualização tracejada). */
export interface OffNetworkSegment {
  a: LatLngTuple;
  b: LatLngTuple;
}

export interface CicloviaNetworkRouteResult {
  positions: LatLngTuple[];
  distanceMeters: number;
  /** Estimativa a ~15 km/h sobre a rede (sem semáforos). */
  durationSeconds: number;
  /** Conectores fora da rede (usuário → snap), para desenho tracejado quando o encosto está além do limiar. */
  offNetworkSegments: OffNetworkSegment[];
}

function toTuple(c: LatLngExpression): LatLngTuple {
  if (Array.isArray(c) && c.length >= 2) {
    return [Number(c[0]), Number(c[1])];
  }
  const o = c as { lat?: number; lng?: number };
  if (typeof o.lat === "number" && typeof o.lng === "number") {
    return [o.lat, o.lng];
  }
  return [0, 0];
}

const GRID = 0.00022;

function cellKey(lat: number, lng: number): string {
  return `${Math.floor(lat / GRID)},${Math.floor(lng / GRID)}`;
}

function neighborCellKeys(lat: number, lng: number): string[] {
  const fx = Math.floor(lat / GRID);
  const fy = Math.floor(lng / GRID);
  const out: string[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      out.push(`${fx + dx},${fy + dy}`);
    }
  }
  return out;
}

type Adj = Map<number, Map<number, number>>;

function addUndirected(adj: Adj, u: number, v: number, w: number): void {
  if (u === v || !(w > 0)) return;
  if (!adj.has(u)) adj.set(u, new Map());
  if (!adj.has(v)) adj.set(v, new Map());
  const mu = adj.get(u)!;
  const mv = adj.get(v)!;
  const eu = mu.get(v);
  if (eu === undefined || w < eu) {
    mu.set(v, w);
    mv.set(u, w);
  }
}

function cloneAdj(adj: Adj): Adj {
  const next = new Map<number, Map<number, number>>();
  for (const [u, m] of adj) {
    next.set(u, new Map(m));
  }
  return next;
}

interface Segment {
  u: number;
  v: number;
  pa: LatLngTuple;
  pb: LatLngTuple;
}

type Snap =
  | { kind: "vertex"; id: number }
  | { kind: "edge"; p: LatLngTuple; u: number; v: number; wu: number; wv: number };

class MinHeap {
  private data: [number, number][] = [];

  push(dist: number, node: number): void {
    this.data.push([dist, node]);
    this.up(this.data.length - 1);
  }

  pop(): [number, number] | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.down(0);
    }
    return top;
  }

  private up(i: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.data[i][0] >= this.data[p][0]) break;
      [this.data[i], this.data[p]] = [this.data[p], this.data[i]];
      i = p;
    }
  }

  private down(i: number): void {
    const n = this.data.length;
    for (;;) {
      let m = i;
      const l = i * 2 + 1;
      const r = i * 2 + 2;
      if (l < n && this.data[l][0] < this.data[m][0]) m = l;
      if (r < n && this.data[r][0] < this.data[m][0]) m = r;
      if (m === i) break;
      [this.data[i], this.data[m]] = [this.data[m], this.data[i]];
      i = m;
    }
  }
}

function dijkstra(
  adj: Adj,
  start: number,
  end: number,
): { dist: number; prev: Map<number, number> } | null {
  const dist = new Map<number, number>();
  const prev = new Map<number, number>();
  const heap = new MinHeap();
  dist.set(start, 0);
  heap.push(0, start);

  while (true) {
    const x = heap.pop();
    if (!x) break;
    const [d, u] = x;
    const du = dist.get(u);
    if (du === undefined || d > du) continue;
    if (u === end) {
      return { dist: d, prev };
    }
    for (const [v, w] of adj.get(u)?.entries() ?? []) {
      const nd = d + w;
      if (!dist.has(v) || nd < dist.get(v)!) {
        dist.set(v, nd);
        prev.set(v, u);
        heap.push(nd, v);
      }
    }
  }
  return null;
}

function reconstructNodePath(prev: Map<number, number>, start: number, end: number): number[] {
  const out: number[] = [];
  let cur: number | undefined = end;
  let guard = 0;
  while (cur !== undefined) {
    out.push(cur);
    if (cur === start) break;
    cur = prev.get(cur);
    if (guard++ > 500000) {
      throw new Error("Caminho inválido na rede.");
    }
  }
  if (out[out.length - 1] !== start) {
    return [];
  }
  out.reverse();
  return out;
}

function buildGraph(
  ciclovias: Ciclovia[],
  mergeM: number,
): { nodes: LatLngTuple[]; adj: Adj; segments: Segment[]; vertexCount: number } {
  const nodes: LatLngTuple[] = [];
  const adj: Adj = new Map();
  const segments: Segment[] = [];
  const cells = new Map<string, number[]>();

  function getOrCreateNode(p: LatLngTuple): number {
    for (const key of neighborCellKeys(p[0], p[1])) {
      for (const id of cells.get(key) ?? []) {
        if (haversineM(p, nodes[id]) <= mergeM) {
          return id;
        }
      }
    }
    const id = nodes.length;
    nodes.push(p);
    const ck = cellKey(p[0], p[1]);
    if (!cells.has(ck)) cells.set(ck, []);
    cells.get(ck)!.push(id);
    return id;
  }

  for (const c of ciclovias) {
    const coords = c.coordinates;
    if (!coords || coords.length < 2) continue;
    for (let i = 0; i < coords.length - 1; i++) {
      const pa = toTuple(coords[i]);
      const pb = toTuple(coords[i + 1]);
      const u = getOrCreateNode(pa);
      const v = getOrCreateNode(pb);
      const w = haversineM(nodes[u], nodes[v]);
      addUndirected(adj, u, v, w);
      segments.push({ u, v, pa, pb });
    }
  }

  const vertexCount = nodes.length;
  return { nodes, adj, segments, vertexCount };
}

function computeSnap(
  q: LatLngTuple,
  baseNodes: readonly LatLngTuple[],
  vertexCount: number,
  segments: readonly Segment[],
): { snap: Snap; distanceM: number } {
  let bestD = Infinity;
  let best: Snap | null = null;

  for (let i = 0; i < vertexCount; i++) {
    const d = haversineM(q, baseNodes[i]);
    if (d < bestD) {
      bestD = d;
      best = { kind: "vertex", id: i };
    }
  }

  for (const seg of segments) {
    const { point: p, distM } = projectPointOnChordSegment(q, seg.pa, seg.pb);
    if (distM < bestD) {
      bestD = distM;
      const wu = haversineM(p, baseNodes[seg.u]);
      const wv = haversineM(p, baseNodes[seg.v]);
      best = { kind: "edge", p, u: seg.u, v: seg.v, wu, wv };
    }
  }

  if (!best) {
    throw new Error("Não foi possível encostar o ponto à rede cicloviária.");
  }
  return { snap: best, distanceM: bestD };
}

function snapPointOnNetwork(snap: Snap, baseNodes: readonly LatLngTuple[]): LatLngTuple {
  if (snap.kind === "vertex") {
    return baseNodes[snap.id];
  }
  return snap.p;
}

function ensureSnapNode(nodes: LatLngTuple[], adj: Adj, snap: Snap): number {
  if (snap.kind === "vertex") {
    return snap.id;
  }
  const id = nodes.length;
  nodes.push(snap.p);
  addUndirected(adj, id, snap.u, snap.wu);
  addUndirected(adj, id, snap.v, snap.wv);
  return id;
}

const DEFAULT_SPEED_MS = 15 / 3.6;

/** Só desenha tracejado “fora da rede” quando o encosto está além deste valor (metros). */
const DEFAULT_OFF_NETWORK_DRAW_M = 20;

/**
 * Rota ao longo da união das polilinhas em `ciclovias`, com nós fundidos até `mergeM`
 * e encosto sempre ao trecho mais próximo (mesmo longe — conectores retos opcionais no mapa).
 */
export function routeOnCicloviaNetwork(
  ciclovias: Ciclovia[],
  waypoints: LatLngTuple[],
  opts?: { mergeM?: number; speedMs?: number; offNetworkDrawM?: number },
): CicloviaNetworkRouteResult {
  if (waypoints.length < 2) {
    throw new Error("São necessários pelo menos dois pontos.");
  }
  const mergeM = opts?.mergeM ?? 20;
  const speedMs = opts?.speedMs ?? DEFAULT_SPEED_MS;
  const offNetworkDrawM = opts?.offNetworkDrawM ?? DEFAULT_OFF_NETWORK_DRAW_M;

  const { nodes: baseNodes, adj: baseAdj, segments, vertexCount } = buildGraph(ciclovias, mergeM);
  if (vertexCount < 2 || baseAdj.size === 0) {
    throw new Error("Rede cicloviária vazia ou sem segmentos. Carregue dados IPPUC ou verifique a fonte.");
  }

  const waypointSnaps: Snap[] = [];
  let connectorDistM = 0;
  const offNetworkSegments: OffNetworkSegment[] = [];

  for (const wp of waypoints) {
    const { snap, distanceM } = computeSnap(wp, baseNodes, vertexCount, segments);
    waypointSnaps.push(snap);
    connectorDistM += distanceM;
    if (distanceM > offNetworkDrawM) {
      offNetworkSegments.push({ a: wp, b: snapPointOnNetwork(snap, baseNodes) });
    }
  }

  const positions: LatLngTuple[] = [];
  let graphDistM = 0;

  for (let leg = 0; leg < waypoints.length - 1; leg++) {
    const adj = cloneAdj(baseAdj);
    const nodes: LatLngTuple[] = [...baseNodes];

    const snapA = waypointSnaps[leg];
    const snapB = waypointSnaps[leg + 1];

    const idA = ensureSnapNode(nodes, adj, snapA);
    const idB = ensureSnapNode(nodes, adj, snapB);

    if (idA === idB) {
      if (leg === 0) positions.push(nodes[idA]);
      continue;
    }

    const res = dijkstra(adj, idA, idB);
    if (!res) {
      throw new Error(
        "Sem caminho na rede IPPUC entre estes pontos. Ajuste os marcadores ou use rota OSRM (rede viária).",
      );
    }

    graphDistM += res.dist;
    const pathIds = reconstructNodePath(res.prev, idA, idB);
    if (pathIds.length === 0) {
      throw new Error(
        "Sem caminho na rede IPPUC entre estes pontos. Ajuste os marcadores ou use rota OSRM (rede viária).",
      );
    }

    const legPts = pathIds.map((id) => nodes[id]);
    if (leg === 0) {
      positions.push(...legPts);
    } else {
      const [first, ...rest] = legPts;
      if (positions.length > 0) {
        const last = positions[positions.length - 1];
        if (haversineM(last, first) < 0.5) {
          positions.push(...rest);
        } else {
          positions.push(...legPts);
        }
      } else {
        positions.push(...legPts);
      }
    }
  }

  if (positions.length < 2) {
    throw new Error("Não foi possível reconstruir a polyline na rede.");
  }

  const distanceMeters = connectorDistM + graphDistM;

  return {
    positions,
    distanceMeters,
    durationSeconds: distanceMeters / speedMs,
    offNetworkSegments,
  };
}
