import type { TrafficHistory } from "@/data/ciclovias";
import { mockTrafficHistory } from "@/data/ciclovias";

function isTrafficRow(x: unknown): x is TrafficHistory {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.hour === "string" &&
    typeof o.movement === "number" &&
    typeof o.cyclists === "number"
  );
}

function parseHistoryPayload(data: unknown): TrafficHistory[] | null {
  const raw = Array.isArray(data) ? data : (data as { history?: unknown })?.history;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  if (!raw.every(isTrafficRow)) return null;
  return raw;
}

/**
 * Histórico de movimento por trecho.
 * Com `VITE_TRAFFIC_HISTORY_URL` definido, faz GET na URL (query `id` = id do trecho, ou substitui `{id}` no template).
 * Resposta esperada: JSON `TrafficHistory[]` ou `{ "history": [...] }`.
 * Se a URL não estiver definida ou a requisição falhar, usa dados de demonstração.
 */
export async function getTrafficHistory(cicloviaId: string): Promise<{
  history: TrafficHistory[];
  source: "remote" | "mock";
}> {
  const template = import.meta.env.VITE_TRAFFIC_HISTORY_URL?.trim();
  if (!template) {
    return { history: mockTrafficHistory, source: "mock" };
  }

  let urlStr: string;
  if (template.includes("{id}")) {
    urlStr = template.replace(/\{id\}/g, encodeURIComponent(cicloviaId));
  } else {
    const base =
      template.startsWith("http://") || template.startsWith("https://")
        ? template
        : new URL(template, typeof window !== "undefined" ? window.location.origin : "https://local.invalid").href;
    const u = new URL(base);
    u.searchParams.set("id", cicloviaId);
    urlStr = u.toString();
  }

  try {
    const res = await fetch(urlStr);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: unknown = await res.json();
    const history = parseHistoryPayload(data);
    if (!history) throw new Error("Formato inválido");
    return { history, source: "remote" };
  } catch {
    return { history: mockTrafficHistory, source: "mock" };
  }
}
