import { MapPin, Navigation, Trash2 } from "lucide-react";

export type RoutePickMode = "none" | "origin" | "dest";

interface RoutePlannerPanelProps {
  pickMode: RoutePickMode;
  onPickModeChange: (mode: RoutePickMode) => void;
  onClear: () => void;
}

export default function RoutePlannerPanel({ pickMode, onPickModeChange, onClear }: RoutePlannerPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rota A → B</h3>
      <p className="text-[10px] text-muted-foreground/90 leading-snug">
        Use os botões abaixo e clique no mapa. Distância e tempo aparecem neste painel. A rota usa OSRM (público)
        e pode não coincidir com a rede IPPUC.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onPickModeChange(pickMode === "origin" ? "none" : "origin")}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            pickMode === "origin"
              ? "border-primary bg-primary/15 text-primary"
              : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={pickMode === "origin"}
        >
          <MapPin className="w-3.5 h-3.5" />
          Origem
        </button>
        <button
          type="button"
          onClick={() => onPickModeChange(pickMode === "dest" ? "none" : "dest")}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            pickMode === "dest"
              ? "border-primary bg-primary/15 text-primary"
              : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={pickMode === "dest"}
        >
          <Navigation className="w-3.5 h-3.5" />
          Destino
        </button>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          aria-label="Limpar rota"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpar
        </button>
      </div>
    </div>
  );
}
