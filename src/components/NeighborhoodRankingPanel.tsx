import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Ciclovia } from "@/data/ciclovias";

interface NeighborhoodRankingPanelProps {
  ciclovias: Ciclovia[];
}

type SortKey = "name" | "totalKm" | "safePct" | "kmCiclovia" | "kmCiclofaixa" | "kmCiclorrota" | "segments";

interface Row {
  name: string;
  totalKm: number;
  safeKm: number;
  safePct: number;
  kmCiclovia: number;
  kmCiclofaixa: number;
  kmCiclorrota: number;
  segments: number;
}

function aggregateByNeighborhood(ciclovias: Ciclovia[]): Row[] {
  const map = new Map<
    string,
    Omit<Row, "safePct"> & { safeKm: number; kmCiclovia: number; kmCiclofaixa: number; kmCiclorrota: number }
  >();

  for (const c of ciclovias) {
    const prev =
      map.get(c.neighborhood) ??
      ({
        name: c.neighborhood,
        totalKm: 0,
        safeKm: 0,
        kmCiclovia: 0,
        kmCiclofaixa: 0,
        kmCiclorrota: 0,
        segments: 0,
      } as Omit<Row, "safePct">);
    prev.totalKm += c.length;
    prev.segments += 1;
    if (c.safety === "safe") prev.safeKm += c.length;
    if (c.type === "ciclovia") prev.kmCiclovia += c.length;
    else if (c.type === "ciclofaixa") prev.kmCiclofaixa += c.length;
    else prev.kmCiclorrota += c.length;
    map.set(c.neighborhood, prev);
  }

  return [...map.values()].map((r) => ({
    ...r,
    safePct: r.totalKm > 0 ? (r.safeKm / r.totalKm) * 100 : 0,
  }));
}

export default function NeighborhoodRankingPanel({ ciclovias }: NeighborhoodRankingPanelProps) {
  const [sortKey, setSortKey] = useState<SortKey>("totalKm");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => aggregateByNeighborhood(ciclovias), [ciclovias]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    const mult = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      if (sortKey === "name") {
        return mult * a.name.localeCompare(b.name, "pt-BR");
      }
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va === vb) return a.name.localeCompare(b.name, "pt-BR");
      return mult * (va - vb);
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 opacity-40" aria-hidden />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 shrink-0" aria-hidden />
    ) : (
      <ArrowDown className="w-3 h-3 shrink-0" aria-hidden />
    );
  };

  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">Sem dados de bairros para exibir.</p>;
  }

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ranking por bairro</h3>
        <p className="text-[10px] text-muted-foreground/90 leading-snug mt-1">
          Soma dos trechos carregados por bairro. “% seg.” é a fração do comprimento (km) classificada como segurança
          segura.
        </p>
      </div>
      <div className="overflow-x-auto rounded-md border border-border/50 -mx-0.5 scrollbar-themed pb-1.5 scroll-smooth">
        <table className="w-full text-left text-[10px] sm:text-xs min-w-[32rem]">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30">
              <th className="p-2 font-medium text-muted-foreground sticky left-0 bg-secondary/90 backdrop-blur-sm z-[1]">
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Bairro <SortIcon column="name" />
                </button>
              </th>
              <th className="p-2 font-medium text-muted-foreground text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => toggleSort("totalKm")}
                  className="inline-flex items-center gap-1 ml-auto hover:text-foreground"
                >
                  km Σ <SortIcon column="totalKm" />
                </button>
              </th>
              <th className="p-2 font-medium text-muted-foreground text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => toggleSort("safePct")}
                  className="inline-flex items-center gap-1 ml-auto hover:text-foreground"
                >
                  % seg. <SortIcon column="safePct" />
                </button>
              </th>
              <th className="p-2 font-medium text-muted-foreground text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => toggleSort("kmCiclovia")}
                  className="inline-flex items-center gap-1 ml-auto hover:text-foreground"
                >
                  km ciclo. <SortIcon column="kmCiclovia" />
                </button>
              </th>
              <th className="p-2 font-medium text-muted-foreground text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => toggleSort("kmCiclofaixa")}
                  className="inline-flex items-center gap-1 ml-auto hover:text-foreground"
                >
                  km faixa <SortIcon column="kmCiclofaixa" />
                </button>
              </th>
              <th className="p-2 font-medium text-muted-foreground text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => toggleSort("kmCiclorrota")}
                  className="inline-flex items-center gap-1 ml-auto hover:text-foreground"
                >
                  km c.rota <SortIcon column="kmCiclorrota" />
                </button>
              </th>
              <th className="p-2 font-medium text-muted-foreground text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => toggleSort("segments")}
                  className="inline-flex items-center gap-1 ml-auto hover:text-foreground"
                >
                  trechos <SortIcon column="segments" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.name} className="border-b border-border/30 last:border-0 hover:bg-secondary/20">
                <td className="p-2 text-foreground max-w-[10rem] truncate sticky left-0 bg-background/95 backdrop-blur-sm z-[1]" title={r.name}>
                  {r.name}
                </td>
                <td className="p-2 text-right font-mono text-foreground whitespace-nowrap">{r.totalKm.toFixed(1)}</td>
                <td className="p-2 text-right font-mono whitespace-nowrap">
                  {r.totalKm > 0 ? `${r.safePct.toFixed(0)}%` : "—"}
                </td>
                <td className="p-2 text-right font-mono whitespace-nowrap">{r.kmCiclovia.toFixed(1)}</td>
                <td className="p-2 text-right font-mono whitespace-nowrap">{r.kmCiclofaixa.toFixed(1)}</td>
                <td className="p-2 text-right font-mono whitespace-nowrap">{r.kmCiclorrota.toFixed(1)}</td>
                <td className="p-2 text-right font-mono whitespace-nowrap">{r.segments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
