import { useState, useEffect } from "react";
import { MapPin, Navigation, Trash2, MapPinned, Sparkles, Search } from "lucide-react";
import type { RouteNetworkMode } from "@/utils/mapUrlParams";
import { forwardGeocode, type ForwardGeocodeHit } from "@/services/forwardGeocode";

export type RoutePickMode = "none" | "origin" | "dest" | "waypoint";

export type RouteAddressTarget = "origin" | "dest" | "waypoint";

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
  /** Definir ponto por endereço (Nominatim). */
  onApplyAddress?: (target: RouteAddressTarget, lat: number, lon: number, label: string) => void;
  /** Trechos fora da rede IPPUC no resumo. */
  hasIppucOffNetworkConnectors?: boolean;
  /** Permite “Parada” por endereço (precisa de origem e destino já definidos no mapa). */
  canSetWaypointByAddress?: boolean;
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
  onApplyAddress,
  hasIppucOffNetworkConnectors = false,
  canSetWaypointByAddress = false,
}: RoutePlannerPanelProps) {
  const [addrQuery, setAddrQuery] = useState("");
  const [addrHits, setAddrHits] = useState<ForwardGeocodeHit[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrTarget, setAddrTarget] = useState<RouteAddressTarget>("origin");

  useEffect(() => {
    if (!onApplyAddress) return;
    const q = addrQuery.trim();
    if (q.length < 2) {
      setAddrHits([]);
      setAddrLoading(false);
      return;
    }
    const ac = new AbortController();
    const t = window.setTimeout(() => {
      setAddrLoading(true);
      forwardGeocode(q, ac.signal)
        .then((hits) => {
          if (!ac.signal.aborted) setAddrHits(hits);
        })
        .catch(() => {
          if (!ac.signal.aborted) setAddrHits([]);
        })
        .finally(() => {
          if (!ac.signal.aborted) setAddrLoading(false);
        });
    }, 400);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [addrQuery, onApplyAddress]);

  useEffect(() => {
    if (addrTarget === "waypoint" && !canSetWaypointByAddress) {
      setAddrTarget("origin");
    }
  }, [addrTarget, canSetWaypointByAddress]);

  const applyHit = (hit: ForwardGeocodeHit) => {
    if (!onApplyAddress) return;
    onApplyAddress(addrTarget, hit.lat, hit.lon, hit.displayName);
    setAddrQuery("");
    setAddrHits([]);
  };

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
        {routeNetworkMode === "ippuc" && hasIppucOffNetworkConnectors && (
          <p className="text-[10px] text-amber-600/90 dark:text-amber-400/90 leading-snug">
            Trecho tracejado: ligação estimada até a rede IPPUC (fora dos trechos desenhados).
          </p>
        )}
      </div>
      {onApplyAddress && (
        <div className="rounded-md border border-border/50 bg-secondary/10 px-2 py-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <label className="sr-only" htmlFor="route-addr-target">
              Aplicar resultado a
            </label>
            <select
              id="route-addr-target"
              value={addrTarget}
              onChange={(e) => setAddrTarget(e.target.value as RouteAddressTarget)}
              className="min-w-0 flex-1 rounded border border-border/60 bg-background/50 px-1.5 py-1 text-[11px] text-foreground"
            >
              <option value="origin">A — origem</option>
              <option value="waypoint" disabled={!canSetWaypointByAddress}>
                Parada
              </option>
              <option value="dest">B — destino</option>
            </select>
          </div>
          <input
            id="route-addr-input"
            type="text"
            inputMode="text"
            enterKeyHint="search"
            value={addrQuery}
            onChange={(e) => setAddrQuery(e.target.value)}
            placeholder="Ex.: Nome da rua, 1200"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded border border-border/60 bg-background/50 px-2 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground"
          />
          {addrLoading ? (
            <p className="text-[10px] text-muted-foreground">…</p>
          ) : null}
          {addrHits.length > 0 && (
            <ul className="max-h-28 overflow-y-auto rounded border border-border/40 bg-background/40">
              {addrHits.map((h, i) => (
                <li key={`${h.lat}-${h.lon}-${i}`}>
                  <button
                    type="button"
                    onClick={() => applyHit(h)}
                    title={h.displayName}
                    className="w-full text-left px-2 py-1.5 text-[11px] text-foreground leading-tight hover:bg-secondary/50 line-clamp-2"
                  >
                    {h.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
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
