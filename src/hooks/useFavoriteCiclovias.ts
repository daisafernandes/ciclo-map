import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ciclovias:favorites:v1";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function writeIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore quota / private mode
  }
}

export function useFavoriteCiclovias() {
  const [ids, setIds] = useState<string[]>(readIds);

  useEffect(() => {
    setIds(readIds());
  }, []);

  const persist = useCallback((next: string[]) => {
    writeIds(next);
    setIds(next);
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setIds((prev) => {
        const has = prev.includes(id);
        const next = has ? prev.filter((x) => x !== id) : [...prev, id];
        writeIds(next);
        return next;
      });
    },
    [],
  );

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  return { favoriteIds: ids, toggleFavorite: toggle, isFavorite: has, clearFavorites: clear };
}
