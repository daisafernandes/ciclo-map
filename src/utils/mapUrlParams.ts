import type { Ciclovia } from "@/data/ciclovias";

export type BaseLayerId = "dark" | "light" | "satellite";

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
