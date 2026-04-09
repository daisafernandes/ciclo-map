import { Loader2 } from "lucide-react";
import type { RoutePickMode } from "@/components/RoutePlannerPanel";

export interface RouteSummaryFieldsProps {
  labelA: string | null;
  labelB: string | null;
  pickMode: RoutePickMode;
  distanceMeters: number | null;
  durationSeconds: number | null;
  loading: boolean;
  error: string | null;
  /** Quando true, mostra A/B mesmo sem rota iniciada (ex.: painel Rota na busca). */
  showPlaceholders?: boolean;
  /** Paradas entre A e B (somente contagem na UI compacta). */
  waypointCount?: number;
}

export function routeSummaryIsActive(props: RouteSummaryFieldsProps): boolean {
  const {
    labelA,
    labelB,
    pickMode,
    loading,
    error,
    distanceMeters,
    durationSeconds,
  } = props;
  return (
    labelA != null ||
    labelB != null ||
    pickMode !== "none" ||
    loading ||
    error != null ||
    (distanceMeters != null && durationSeconds != null)
  );
}

export function RouteSummaryFields({
  labelA,
  labelB,
  pickMode,
  distanceMeters,
  durationSeconds,
  loading,
  error,
  showPlaceholders = false,
  waypointCount = 0,
}: RouteSummaryFieldsProps) {
  const pickHint =
    pickMode === "origin"
      ? "Clique no mapa: origem"
      : pickMode === "dest"
        ? "Clique no mapa: destino"
        : pickMode === "waypoint"
          ? "Clique no mapa: parada (antes do destino)"
          : null;

  const showBody =
    showPlaceholders ||
    routeSummaryIsActive({ labelA, labelB, pickMode, loading, error, distanceMeters, durationSeconds });
  if (!showBody) return null;

  return (
    <div className="min-w-0 space-y-0.5 text-xs">
      {pickHint && <p className="text-[11px] font-medium text-primary leading-snug">{pickHint}</p>}
      <div className="flex flex-col gap-0.5 text-muted-foreground min-w-0">
        <p className="truncate" title={labelA ?? undefined}>
          <span className="text-muted-foreground/80 font-medium">A</span>{" "}
          <span className="text-foreground">{labelA ?? "—"}</span>
        </p>
        {waypointCount > 0 && (
          <p className="text-[10px] text-muted-foreground/90 pl-1 border-l border-border/40">
            + {waypointCount} parada{waypointCount === 1 ? "" : "s"}
          </p>
        )}
        <p className="truncate" title={labelB ?? undefined}>
          <span className="text-muted-foreground/80 font-medium">B</span>{" "}
          <span className="text-foreground">{labelB ?? "—"}</span>
        </p>
      </div>
      {loading && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          Calculando rota…
        </div>
      )}
      {error && !loading && <p className="text-[11px] text-destructive leading-snug pt-0.5">{error}</p>}
      {distanceMeters != null && durationSeconds != null && !loading && (
        <p className="text-[11px] font-mono text-foreground pt-0.5">
          ≈ {(distanceMeters / 1000).toFixed(2)} km · {Math.round(durationSeconds / 60)} min
        </p>
      )}
    </div>
  );
}

