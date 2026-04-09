import { MapPin, Navigation, Trash2, MapPinned, Sparkles } from "lucide-react";
import type { RouteNetworkMode } from "@/utils/mapUrlParams";

export type RoutePickMode = "none" | "origin" | "dest" | "waypoint";

interface RoutePlannerPanelProps {
  pickMode: RoutePickMode;
  onPickModeChange: (mode: RoutePickMode) => void;
  onClear: () => void;
  /** Número de paradas intermediárias (entre origem e destino). */
  waypointCount: number;
  /** Mostrar otimização de ordem (OSRM Trip) quando há mais de uma parada. */
  canOptimizeTrip: boolean;
  onOptimizeTrip: () => void;
  optimizeLoading: boolean;
  routeNetworkMode: RouteNetworkMode;
  onRouteNetworkModeChange: (mode: RouteNetworkMode) => void;
}

export default function RoutePlannerPanel({
  pickMode,
  onPickModeChange,
  onClear,
  waypointCount,
  canOptimizeTrip,
  onOptimizeTrip,
  optimizeLoading,
  routeNetworkMode,
  onRouteNetworkModeChange,
}: RoutePlannerPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rota com paradas</h3>
      <div className="space-y-1.5">
        <label htmlFor="route-network-mode" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Modo de rota
        </label>
        <select
          id="route-network-mode"
          value={routeNetworkMode}
          onChange={(e) => onRouteNetworkModeChange(e.target.value as RouteNetworkMode)}
          className="w-full rounded-md border border-border/60 bg-background/50 px-2 py-1.5 text-xs text-foreground"
        >
          <option value="osrm">OSRM — rede viária (OpenStreetMap)</option>
          <option value="ippuc">Rede IPPUC — só ciclovias do mapa</option>
        </select>
        <p className="text-[10px] text-muted-foreground/90 leading-snug">
          {routeNetworkMode === "ippuc"
            ? "A linha segue os trechos carregados (ideal com dados ao vivo). A rede pode estar desconectada; aproxime os pontos aos traços."
            : "Rotas OSRM usam sempre o perfil de bicicleta (OSM). O servidor público pode não suportá-lo — use uma instância OSRM própria e VITE_OSRM_URL no .env."}
        </p>
      </div>
      <p className="text-[10px] text-muted-foreground/90 leading-snug">
        Origem e destino obrigatórios; “Parada” insere um ponto entre eles.
        {routeNetworkMode === "osrm" ? " A rota pode não coincidir com a camada IPPUC." : ""}
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
          onClick={() => onPickModeChange(pickMode === "waypoint" ? "none" : "waypoint")}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            pickMode === "waypoint"
              ? "border-primary bg-primary/15 text-primary"
              : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={pickMode === "waypoint"}
        >
          <MapPinned className="w-3.5 h-3.5" />
          Parada
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
      {waypointCount > 0 && (
        <p className="text-[10px] text-muted-foreground">
          {waypointCount} parada{waypointCount === 1 ? "" : "s"} intermediária
          {waypointCount === 1 ? "" : "s"}.
        </p>
      )}
      {canOptimizeTrip && (
        <button
          type="button"
          onClick={onOptimizeTrip}
          disabled={optimizeLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border/60 bg-secondary/30 px-2.5 py-2 text-xs font-medium text-foreground hover:bg-secondary/50 disabled:opacity-60"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          {optimizeLoading ? "Otimizando ordem…" : "Otimizar ordem das paradas"}
        </button>
      )}
    </div>
  );
}
