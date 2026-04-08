import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Ciclovia } from "@/data/ciclovias";
import { getTypeLabel } from "@/data/ciclovias";

interface CityStatsPanelProps {
  ciclovias: Ciclovia[];
  /** Dentro de popover ou painel — sem cartão animado. */
  embedded?: boolean;
}

const TYPE_ORDER: Ciclovia["type"][] = ["ciclovia", "ciclofaixa", "ciclorrota"];
const SAFETY_ORDER: Ciclovia["safety"][] = ["safe", "moderate", "caution"];

const safetyLabels: Record<Ciclovia["safety"], string> = {
  safe: "Seguro",
  moderate: "Moderado",
  caution: "Atenção",
};

export default function CityStatsPanel({ ciclovias, embedded = false }: CityStatsPanelProps) {
  const stats = useMemo(() => {
    const byType: Record<Ciclovia["type"], number> = {
      ciclovia: 0,
      ciclofaixa: 0,
      ciclorrota: 0,
    };
    const bySafety: Record<Ciclovia["safety"], number> = {
      safe: 0,
      moderate: 0,
      caution: 0,
    };
    const kmByNeighborhood = new Map<string, number>();

    for (const c of ciclovias) {
      byType[c.type] += 1;
      bySafety[c.safety] += 1;
      const prev = kmByNeighborhood.get(c.neighborhood) ?? 0;
      kmByNeighborhood.set(c.neighborhood, prev + c.length);
    }

    const topNeighborhoods = [...kmByNeighborhood.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const totalKm = ciclovias.reduce((acc, c) => acc + c.length, 0);

    return { byType, bySafety, topNeighborhoods, totalKm, count: ciclovias.length };
  }, [ciclovias]);

  const inner = (
    <>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estatísticas (visíveis)</h3>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-md border border-border/40 bg-background/30 px-2 py-2">
          <p className="text-lg font-bold text-primary font-mono leading-none">{stats.count}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Trechos</p>
        </div>
        <div className="rounded-md border border-border/40 bg-background/30 px-2 py-2">
          <p className="text-lg font-bold text-foreground font-mono leading-none">
            {stats.count ? stats.totalKm.toFixed(1) : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">km somados</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground/90 uppercase tracking-wider">Por tipo</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {TYPE_ORDER.map((t) => (
            <li key={t} className="flex justify-between gap-2">
              <span className="truncate">{getTypeLabel(t)}</span>
              <span className="font-mono text-foreground shrink-0">{stats.byType[t]}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground/90 uppercase tracking-wider">Por segurança</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {SAFETY_ORDER.map((s) => (
            <li key={s} className="flex justify-between gap-2">
              <span>{safetyLabels[s]}</span>
              <span className="font-mono text-foreground shrink-0">{stats.bySafety[s]}</span>
            </li>
          ))}
        </ul>
      </div>
      {stats.topNeighborhoods.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground/90 uppercase tracking-wider">km por bairro (top)</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {stats.topNeighborhoods.map(([name, km]) => (
              <li key={name} className="flex justify-between gap-2">
                <span className="truncate" title={name}>
                  {name}
                </span>
                <span className="font-mono text-foreground shrink-0">{km.toFixed(1)} km</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div className="space-y-3">{inner}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass-panel-sm p-3 space-y-3"
    >
      {inner}
    </motion.div>
  );
}
