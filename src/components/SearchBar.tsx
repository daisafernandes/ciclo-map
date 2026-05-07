import { useState, useRef, useMemo, useEffect } from "react";
import { Search, X, MapPin, Building2, Star, Route, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Ciclovia, getTypeLabel } from "@/data/ciclovias";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import RoutePlannerPanel, {
  type RoutePickMode,
  type RouteAddressTarget,
} from "@/components/RoutePlannerPanel";
import type { RouteNetworkMode } from "@/utils/mapUrlParams";
import type { ParkNearRouteSuggestion } from "@/utils/parksNearRoute";
import { buildWhatsAppShareUrl, formatRouteShareMessage } from "@/utils/routeShare";
import RouteElevationChart from "@/components/RouteElevationChart";
import { RouteSummaryFields, routeSummaryIsActive } from "@/components/RouteSummaryStrip";
import type { ElevationProfilePoint } from "@/services/elevation";
import { cn } from "@/lib/utils";
import { normalizeText } from "@/utils/geoFormat";

export interface SearchBarRouteProps {
  pickMode: RoutePickMode;
  onPickModeChange: (mode: RoutePickMode) => void;
  onClear: () => void;
  labelA: string | null;
  labelB: string | null;
  waypointCount: number;
  onOptimizeTrip: () => void;
  optimizeLoading: boolean;
  canOptimizeTrip: boolean;
  parkSuggestions: ParkNearRouteSuggestion[];
  distanceMeters: number | null;
  durationSeconds: number | null;
  loading: boolean;
  error: string | null;
  elevationLoading: boolean;
  elevationError: string | null;
  elevationData: ElevationProfilePoint[] | null;
  routeNetworkMode: RouteNetworkMode;
  onRouteNetworkModeChange: (mode: RouteNetworkMode) => void;
  onRouteAddressApply?: (target: RouteAddressTarget, lat: number, lon: number, label: string) => void;
  hasIppucOffNetworkConnectors?: boolean;
  canSetWaypointByAddress?: boolean;
}

interface SearchBarProps {
  ciclovias: Ciclovia[];
  onSelectCiclovia: (ciclovia: Ciclovia) => void;
  onSelectNeighborhood: (neighborhoodName: string, cicloviasInNeighborhood: Ciclovia[]) => void;
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  /** Ao limpar o campo de busca: resetar mapa/seleção (página principal). */
  onClearSearch?: () => void;
  /** Alinhar tema do popover ao mapa claro (portais ficam fora do `.light-map-ui`). */
  mapUiLight?: boolean;
  route: SearchBarRouteProps;
}

const SearchBar = ({
  ciclovias,
  onSelectCiclovia,
  onSelectNeighborhood,
  favoriteIds,
  onToggleFavorite,
  onClearSearch,
  mapUiLight = false,
  route,
}: SearchBarProps) => {
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [routeOpen, setRouteOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevPickMode = useRef<RoutePickMode>(route.pickMode);

  useEffect(() => {
    if (prevPickMode.current !== "none" && route.pickMode === "none") {
      setRouteOpen(false);
    }
    prevPickMode.current = route.pickMode;
  }, [route.pickMode]);

  const routeActive = routeSummaryIsActive({
    labelA: route.labelA,
    labelB: route.labelB,
    pickMode: route.pickMode,
    distanceMeters: route.distanceMeters,
    durationSeconds: route.durationSeconds,
    loading: route.loading,
    error: route.error,
  });

  const { neighborhoodRows, cicloviaRows } = useMemo(() => {
    const q = query.trim();
    if (q.length === 0) {
      return { neighborhoodRows: [] as { name: string; list: Ciclovia[] }[], cicloviaRows: [] as Ciclovia[] };
    }
    const nq = normalizeText(q);

    const matchesText = (text: string) => normalizeText(text).includes(nq);

    const byNeighborhood = new Map<string, Ciclovia[]>();
    for (const c of ciclovias) {
      if (matchesText(c.neighborhood)) {
        const list = byNeighborhood.get(c.neighborhood) ?? [];
        list.push(c);
        byNeighborhood.set(c.neighborhood, list);
      }
    }
    const neighborhoodRows = [...byNeighborhood.entries()]
      .map(([name, list]) => ({ name, list }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    const cicloviaRows = ciclovias.filter(
      (c) =>
        matchesText(c.name) ||
        matchesText(c.street) ||
        matchesText(c.neighborhood),
    );

    return { neighborhoodRows, cicloviaRows };
  }, [ciclovias, query]);

  const hasResults = neighborhoodRows.length > 0 || cicloviaRows.length > 0;
  const canShareRoute =
    route.distanceMeters != null &&
    route.durationSeconds != null &&
    !route.loading &&
    route.error == null;

  const handleSelectCiclovia = (ciclovia: Ciclovia) => {
    onSelectCiclovia(ciclovia);
    setQuery(ciclovia.name);
    setIsFocused(false);
  };

  const handleSelectNeighborhood = (name: string, list: Ciclovia[]) => {
    onSelectNeighborhood(name, list);
    setQuery(name);
    setIsFocused(false);
  };

  const handleShareOnWhatsApp = () => {
    if (!canShareRoute || route.distanceMeters == null || route.durationSeconds == null) {
      return;
    }

    const absoluteUrl = `${window.location.origin}${location.pathname}${location.search}`;
    const message = formatRouteShareMessage({
      labelA: route.labelA,
      labelB: route.labelB,
      waypointCount: route.waypointCount,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      routeNetworkMode: route.routeNetworkMode,
      absoluteUrl,
    });
    const shareUrl = buildWhatsAppShareUrl(message);
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative w-full max-w-md">
      <div
        className={cn(
          "glass-panel box-border flex h-12 shrink-0 items-center gap-2 sm:gap-3 px-3 sm:px-4 transition-all duration-300",
          isFocused && "glow-accent ring-1 ring-primary/30",
        )}
      >
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar ciclovia, rua ou bairro..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="flex-1 min-w-0 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onClearSearch?.();
              inputRef.current?.focus();
            }}
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}
        <Popover open={routeOpen} onOpenChange={setRouteOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center gap-1 shrink-0 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                routeActive
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/60 bg-background/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              )}
              aria-label="Rota A → B — abrir painel"
              aria-expanded={routeOpen}
            >
              <Route className="w-4 h-4 shrink-0" aria-hidden />
              <span className="sr-only">Rota</span>
              {routeActive ? (
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden />
              ) : null}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className={cn("w-80 z-[100] p-3 sm:p-4", mapUiLight && "light-map-ui")}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="space-y-4">
              <RoutePlannerPanel
                pickMode={route.pickMode}
                onPickModeChange={route.onPickModeChange}
                onClear={route.onClear}
                waypointCount={route.waypointCount}
                canOptimizeTrip={route.canOptimizeTrip}
                onOptimizeTrip={route.onOptimizeTrip}
                optimizeLoading={route.optimizeLoading}
                routeNetworkMode={route.routeNetworkMode}
                onRouteNetworkModeChange={route.onRouteNetworkModeChange}
                onApplyAddress={route.onRouteAddressApply}
                hasIppucOffNetworkConnectors={route.hasIppucOffNetworkConnectors}
                canSetWaypointByAddress={route.canSetWaypointByAddress}
              />
              <div className="border-t border-border/50 pt-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resumo</p>
                <RouteSummaryFields
                  labelA={route.labelA}
                  labelB={route.labelB}
                  pickMode={route.pickMode}
                  distanceMeters={route.distanceMeters}
                  durationSeconds={route.durationSeconds}
                  loading={route.loading}
                  error={route.error}
                  waypointCount={route.waypointCount}
                  showPlaceholders
                />
                {canShareRoute && (
                  <button
                    type="button"
                    onClick={handleShareOnWhatsApp}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/30 px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-secondary/50"
                    aria-label="Compartilhar rota no WhatsApp com link para o mapa"
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                    WhatsApp
                  </button>
                )}
                {route.parkSuggestions.length > 0 && (
                  <div className="rounded-md border border-border/50 bg-secondary/15 px-2 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Parques perto do trajeto
                    </p>
                    <ul className="space-y-1 text-[11px] text-muted-foreground leading-snug">
                      {route.parkSuggestions.map((p) => (
                        <li key={p.id}>
                          <span className="text-foreground/90">{p.name}</span>
                          <span className="text-muted-foreground/80"> · ~{p.distanceM} m</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(route.elevationLoading ||
                  route.elevationError ||
                  (route.elevationData?.length ?? 0) > 0) && (
                  <div className="border-t border-border/50 pt-3">
                    <RouteElevationChart
                      data={route.elevationData}
                      loading={route.elevationLoading}
                      error={route.elevationError}
                    />
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <AnimatePresence>
        {isFocused && hasResults && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-2 w-full glass-panel overflow-hidden z-50"
          >
            <div className="max-h-64 overflow-y-auto">
              {neighborhoodRows.length > 0 && (
                <div className="border-b border-border/40">
                  <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Bairros
                  </p>
                  {neighborhoodRows.map(({ name, list }) => (
                    <button
                      key={`nb-${name}`}
                      type="button"
                      onMouseDown={() => handleSelectNeighborhood(name, list)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <Building2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          Bairro · {list.length} {list.length === 1 ? "trecho" : "trechos"} cicloviário{list.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {cicloviaRows.length > 0 && (
                <div>
                  {neighborhoodRows.length > 0 && (
                    <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Ciclovias
                    </p>
                  )}
                  {cicloviaRows.map((ciclovia) => (
                    <div
                      key={ciclovia.id}
                      className="flex items-stretch gap-0 border-b border-border/20 last:border-b-0"
                    >
                      <button
                        type="button"
                        onMouseDown={() => handleSelectCiclovia(ciclovia)}
                        className="flex-1 flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left min-w-0"
                      >
                        <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{ciclovia.name}</p>
                          <p className="text-xs text-muted-foreground">{ciclovia.neighborhood} · {ciclovia.length} km</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{getTypeLabel(ciclovia.type, ciclovia.tipoLabelIppuc)}</span>
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleFavorite(ciclovia.id);
                        }}
                        className="px-3 flex items-center hover:bg-secondary/60 transition-colors shrink-0"
                        aria-label={favoriteIds.has(ciclovia.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        aria-pressed={favoriteIds.has(ciclovia.id)}
                      >
                        <Star
                          className={`w-4 h-4 ${favoriteIds.has(ciclovia.id) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
