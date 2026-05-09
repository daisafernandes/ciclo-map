import { Route, MapPin, Clock, GitBranch, Loader2, TrendingUp, TrendingDown, Trash2, Navigation } from "lucide-react";
import { useMemo } from "react";
import type { RouteNetworkMode } from "@/utils/mapUrlParams";
import type { ElevationProfilePoint } from "@/services/elevation";
import type { WeatherData } from "@/data/ciclovias";
import { calculateRouteDifficulty } from "@/utils/routeDifficultyScore";
import { cn } from "@/lib/utils";

export interface RouteInfoPanelProps {
  labelA: string | null;
  labelB: string | null;
  waypointCount: number;
  distanceMeters: number;
  durationSeconds: number;
  routeNetworkMode: RouteNetworkMode;
  hasIppucOffNetworkConnectors: boolean;
  elevationLoading?: boolean;
  elevationError?: string | null;
  elevationData?: ElevationProfilePoint[] | null;
  /** Limpa rota, marcadores e resumo (mapa + URL). */
  onClear: () => void;
  /** Se true, há steps OSRM disponíveis para navegação. */
  canNavigate?: boolean;
  /** Callback para iniciar modo navegação. */
  onStartNavigation?: () => void;
  /** Só modo OSRM A→B: várias rotas do servidor (estilo Waze). */
  routeAlternatives?: { distanceMeters: number; durationSeconds: number }[] | null;
  selectedRouteAlternativeIndex?: number;
  onSelectRouteAlternative?: (index: number) => void;
  weatherData?: WeatherData | null;
}

function elevationRangeM(data: ElevationProfilePoint[]): { min: number; max: number } | null {
  if (data.length === 0) return null;
  let min = data[0].elevationM;
  let max = min;
  for (let i = 1; i < data.length; i++) {
    const e = data[i].elevationM;
    if (e < min) min = e;
    if (e > max) max = e;
  }
  return { min, max };
}

const RouteInfoPanel = ({
  labelA,
  labelB,
  waypointCount,
  distanceMeters,
  durationSeconds,
  routeNetworkMode,
  hasIppucOffNetworkConnectors,
  elevationLoading = false,
  elevationError = null,
  elevationData = null,
  onClear,
  canNavigate = false,
  onStartNavigation,
  routeAlternatives = null,
  selectedRouteAlternativeIndex = 0,
  onSelectRouteAlternative,
  weatherData = null,
}: RouteInfoPanelProps) => {
  const km = distanceMeters / 1000;
  const minRounded = Math.round(durationSeconds / 60);
  const modeLabel =
    routeNetworkMode === "ippuc" ? "Rede IPPUC (ciclovias)" : "OSRM — rede viária (OSM)";
  const elevRange = elevationData?.length ? elevationRangeM(elevationData) : null;

  const difficulty = useMemo(() => {
    if (!elevationData?.length) return null;
    return calculateRouteDifficulty({
      elevationData,
      distanceMeters,
      weatherData: weatherData ?? undefined,
      routeNetworkMode,
    });
  }, [elevationData, distanceMeters, weatherData, routeNetworkMode]);

  const difficultyColors: Record<string, string> = {
    "Fácil": "text-emerald-500",
    "Moderado": "text-amber-500",
    "Difícil": "text-red-500",
  };

  return (
    <div className="glass-panel-sm p-3 md:p-4 animate-slide-up">
      <div className="flex items-center justify-between gap-2 mb-2 md:mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
            Rota traçada
          </h3>
          <span
            className="text-[10px] md:text-xs text-primary/90 font-medium truncate"
            title={modeLabel}
          >
            {routeNetworkMode === "ippuc" ? "IPPUC" : "OSRM"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {canNavigate && onStartNavigation && (
            <button
              type="button"
              onClick={onStartNavigation}
              className="inline-flex items-center gap-1 rounded-md border border-primary/50 bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
              aria-label="Iniciar navegação turn-by-turn"
            >
              <Navigation className="w-3 h-3" aria-hidden />
              Navegar
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-destructive/15 hover:text-destructive hover:border-destructive/35 transition-colors"
            aria-label="Limpar rota e remover marcadores do mapa"
          >
            <Trash2 className="w-3 h-3" aria-hidden />
            Limpar
          </button>
        </div>
      </div>

      {routeAlternatives &&
        routeAlternatives.length > 1 &&
        onSelectRouteAlternative &&
        routeNetworkMode === "osrm" && (
          <div
            className="flex flex-wrap gap-1.5 mb-2 md:mb-3"
            role="tablist"
            aria-label="Escolher rota alternativa"
          >
            {routeAlternatives.map((alt, i) => {
              const sel = selectedRouteAlternativeIndex === i;
              const kmAlt = alt.distanceMeters / 1000;
              const minAlt = Math.round(alt.durationSeconds / 60);
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={sel}
                  onClick={() => onSelectRouteAlternative(i)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[10px] font-medium transition-colors tabular-nums",
                    sel
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                  )}
                >
                  Rota {i + 1} · {kmAlt.toFixed(1)} km · ~{minAlt} min
                </button>
              );
            })}
          </div>
        )}

      <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
        <Route className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="text-xl md:text-2xl font-bold text-foreground font-mono tabular-nums">
            {km.toFixed(2)} km
          </p>
          <p className="text-[11px] md:text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3 h-3 shrink-0 opacity-80" aria-hidden />
            ~{minRounded} min (estimativa)
          </p>
        </div>
      </div>

      {difficulty && (
        <div className="flex items-center gap-2 mb-2 md:mb-3">
          <span className={cn("text-xs font-semibold", difficultyColors[difficulty.level])}>
            ● {difficulty.level}
          </span>
          {difficulty.elevationGainM > 5 && (
            <span className="text-[10px] text-muted-foreground">
              ↑ {Math.round(difficulty.elevationGainM)} m ganho
            </span>
          )}
          {difficulty.factors.length > 0 && (
            <span
              className="text-[10px] text-muted-foreground truncate"
              title={difficulty.factors.join(" · ")}
            >
              · {difficulty.factors[0]}
            </span>
          )}
        </div>
      )}

      <div className="space-y-2 md:space-y-2.5 mb-2 md:mb-3">
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground">Origem</p>
            <p className="text-[11px] md:text-xs text-foreground leading-snug truncate" title={labelA ?? undefined}>
              {labelA ?? "—"}
            </p>
          </div>
        </div>
        {waypointCount > 0 && (
          <div className="flex items-start gap-2 pl-1 border-l border-border/50 ml-1.5">
            <GitBranch className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Paradas</p>
              <p className="text-[11px] md:text-xs text-foreground">
                {waypointCount} intermediária{waypointCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground">Destino</p>
            <p className="text-[11px] md:text-xs text-foreground leading-snug truncate" title={labelB ?? undefined}>
              {labelB ?? "—"}
            </p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/90 leading-snug border-t border-border/40 pt-2 md:pt-3">
        {modeLabel}
        {routeNetworkMode === "osrm" &&
          routeAlternatives &&
          routeAlternatives.length > 1 &&
          " — linhas tracejadas: outras opções."}
      </p>

      {routeNetworkMode === "ippuc" && hasIppucOffNetworkConnectors && (
        <p className="text-[10px] text-amber-600/90 dark:text-amber-400/90 leading-snug mt-2">
          Inclui trecho tracejado fora da rede (ligação até a ciclovia).
        </p>
      )}

      {(elevationLoading || elevationError || elevRange) && (
        <div className="border-t border-border/40 pt-2 md:pt-3 mt-2 md:mt-3">
          {elevationLoading && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden />
              Carregando elevação…
            </div>
          )}
          {elevationError && !elevationLoading && (
            <p className="text-[10px] text-muted-foreground leading-snug">{elevationError}</p>
          )}
          {elevRange && !elevationLoading && (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <TrendingDown className="w-3.5 h-3.5 text-sky-500 shrink-0" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Mín.</p>
                  <p className="font-mono text-foreground tabular-nums">{Math.round(elevRange.min)} m</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <TrendingUp className="w-3.5 h-3.5 text-orange-400 shrink-0" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Máx.</p>
                  <p className="font-mono text-foreground tabular-nums">{Math.round(elevRange.max)} m</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RouteInfoPanel;
