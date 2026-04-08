import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bike, Menu, X, Navigation, ChevronDown, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { LatLngExpression, type LatLngTuple, type LatLngBounds } from "leaflet";
import CycleMap from "@/components/CycleMap";
import SearchBar from "@/components/SearchBar";
import { midpoint, neighborhoodHighlightShape } from "@/utils/mapBounds";
import WeatherPanel from "@/components/WeatherPanel";
import CicloviaDetail from "@/components/CicloviaDetail";
import MapLegend from "@/components/MapLegend";
import MapLayerFiltersPopover from "@/components/MapLayerFiltersPopover";
import CityStatsPanel from "@/components/CityStatsPanel";
import NeighborhoodRankingPanel from "@/components/NeighborhoodRankingPanel";
import { type RoutePickMode } from "@/components/RoutePlannerPanel";
import SourcesPanel from "@/components/SourcesPanel";
import { TipologiasModal } from "@/components/shared/TipologiasModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { mockWeather, Ciclovia } from "@/data/ciclovias";
import { loadCiclovias } from "@/services/cicloviasSource";
import { fetchCuritibaWeather } from "@/services/weather";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFavoriteCiclovias } from "@/hooks/useFavoriteCiclovias";
import { fetchOsrmRoute } from "@/services/routing";
import { fetchElevationProfile, type ElevationProfilePoint } from "@/services/elevation";
import { reverseGeocodePoint } from "@/services/reverseGeocode";
import { formatLatLngTuple } from "@/utils/geoFormat";
import {
  encodeTypeFilter,
  encodeSafetyFilter,
  decodeTypeFilter,
  decodeSafetyFilter,
  parseBaseLayer,
  baseLayerToParam,
  encodeRoutePoint,
  decodeRoutePoint,
  type BaseLayerId,
} from "@/utils/mapUrlParams";
import { cn } from "@/lib/utils";

const defaultTypeFilter: Record<Ciclovia["type"], boolean> = {
  ciclovia: true,
  ciclofaixa: true,
  ciclorrota: true,
};

const defaultSafetyFilter: Record<Ciclovia["safety"], boolean> = {
  safe: true,
  moderate: true,
  caution: true,
};

const emptyCiclovias: Ciclovia[] = [];

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading } = useQuery({
    queryKey: ["ciclovias", import.meta.env.VITE_CICLOVIAS_LIVE_URL ?? ""],
    queryFn: loadCiclovias,
    staleTime: 1000 * 60 * 30,
  });

  const weatherQuery = useQuery({
    queryKey: ["weather", "curitiba"],
    queryFn: fetchCuritibaWeather,
    staleTime: 1000 * 60 * 15,
    retry: 1,
  });

  const ciclovias = data?.ciclovias ?? emptyCiclovias;
  const loadMode = data?.mode ?? "static";

  const [selectedCiclovia, setSelectedCiclovia] = useState<Ciclovia | null>(null);
  const [flyTo, setFlyTo] = useState<LatLngExpression | null>(null);
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);
  const [mapHighlightIds, setMapHighlightIds] = useState<string[] | null>(null);
  const [neighborhoodHighlight, setNeighborhoodHighlight] = useState<{
    outline: LatLngTuple[];
    bounds: LatLngBounds;
    key: string;
  } | null>(null);
  const neighborhoodFitSeq = useRef(0);
  const [neighborhoodName, setNeighborhoodName] = useState<string | null>(null);
  const [parksVisible, setParksVisible] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState(defaultTypeFilter);
  const [safetyFilter, setSafetyFilter] = useState(defaultSafetyFilter);
  const [baseLayer, setBaseLayer] = useState<BaseLayerId>("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tipologiasOpen, setTipologiasOpen] = useState(false);
  const [urlReady, setUrlReady] = useState(false);

  const { position: geoPosition, error: geoError, requestPosition, clearError: clearGeoError } =
    useGeolocation();

  const { favoriteIds: favoriteIdsArr, toggleFavorite, isFavorite } = useFavoriteCiclovias();
  const favoriteIdSet = useMemo(() => new Set(favoriteIdsArr), [favoriteIdsArr]);

  useEffect(() => {
    if (favoriteIdsArr.length === 0) setFavoritesOnly(false);
  }, [favoriteIdsArr.length]);

  const [routePointA, setRoutePointA] = useState<LatLngTuple | null>(null);
  const [routePointB, setRoutePointB] = useState<LatLngTuple | null>(null);
  const [routePickMode, setRoutePickMode] = useState<RoutePickMode>("none");
  const [routeLinePositions, setRouteLinePositions] = useState<LatLngTuple[] | null>(null);
  const [routeDistanceM, setRouteDistanceM] = useState<number | null>(null);
  const [routeDurationS, setRouteDurationS] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeLabelA, setRouteLabelA] = useState<string | null>(null);
  const [routeLabelB, setRouteLabelB] = useState<string | null>(null);
  const [elevationData, setElevationData] = useState<ElevationProfilePoint[] | null>(null);
  const [elevationLoading, setElevationLoading] = useState(false);
  const [elevationError, setElevationError] = useState<string | null>(null);

  const handleRouteMapClick = useCallback(
    (p: LatLngTuple) => {
      if (routePickMode === "origin") setRoutePointA(p);
      else if (routePickMode === "dest") setRoutePointB(p);
      setRoutePickMode("none");
    },
    [routePickMode],
  );

  const clearRoute = useCallback(() => {
    setRoutePointA(null);
    setRoutePointB(null);
    setRouteLinePositions(null);
    setRouteDistanceM(null);
    setRouteDurationS(null);
    setRouteError(null);
    setRoutePickMode("none");
    setRouteLoading(false);
    setRouteLabelA(null);
    setRouteLabelB(null);
    setElevationData(null);
    setElevationError(null);
    setElevationLoading(false);
  }, []);

  useEffect(() => {
    if (!routePointA) {
      setRouteLabelA(null);
      return;
    }
    const ac = new AbortController();
    let cancelled = false;
    setRouteLabelA(formatLatLngTuple(routePointA));
    reverseGeocodePoint(routePointA, ac.signal)
      .then((t) => {
        if (!cancelled && t) setRouteLabelA(t);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [routePointA]);

  useEffect(() => {
    if (!routePointB) {
      setRouteLabelB(null);
      return;
    }
    const ac = new AbortController();
    let cancelled = false;
    setRouteLabelB(formatLatLngTuple(routePointB));
    reverseGeocodePoint(routePointB, ac.signal)
      .then((t) => {
        if (!cancelled && t) setRouteLabelB(t);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [routePointB]);

  useEffect(() => {
    if (!routePointA || !routePointB) {
      setRouteLinePositions(null);
      setRouteDistanceM(null);
      setRouteDurationS(null);
      setRouteError(null);
      setRouteLoading(false);
      return;
    }
    let cancelled = false;
    setRouteLoading(true);
    setRouteError(null);
    fetchOsrmRoute(routePointA, routePointB)
      .then((r) => {
        if (cancelled) return;
        setRouteLinePositions(r.positions);
        setRouteDistanceM(r.distanceMeters);
        setRouteDurationS(r.durationSeconds);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setRouteLinePositions(null);
        setRouteDistanceM(null);
        setRouteDurationS(null);
        setRouteError(e instanceof Error ? e.message : "Não foi possível calcular a rota.");
      })
      .finally(() => {
        if (!cancelled) setRouteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [routePointA, routePointB]);

  useEffect(() => {
    if (!routeLinePositions?.length) {
      setElevationData(null);
      setElevationError(null);
      setElevationLoading(false);
      return;
    }
    let cancelled = false;
    setElevationLoading(true);
    setElevationError(null);
    fetchElevationProfile(routeLinePositions)
      .then((p) => {
        if (!cancelled) setElevationData(p);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setElevationData(null);
          setElevationError(e instanceof Error ? e.message : "Elevação indisponível.");
        }
      })
      .finally(() => {
        if (!cancelled) setElevationLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [routeLinePositions]);

  /** Qualquer ponto de rota substitui seleção de trecho/bairro (alinha com URL `from`/`to`). */
  useEffect(() => {
    if (!routePointA && !routePointB) return;
    setSelectedCiclovia(null);
    setNeighborhoodName(null);
    setNeighborhoodHighlight(null);
    setMapHighlightIds(null);
    setSidebarOpen(false);
    setFlyTo(null);
  }, [routePointA, routePointB]);

  const visibleCiclovias = useMemo(() => {
    let list = ciclovias;
    if (mapHighlightIds) {
      const idSet = new Set(mapHighlightIds);
      list = list.filter((c) => idSet.has(c.id));
    }
    list = list.filter((c) => typeFilter[c.type] && safetyFilter[c.safety]);
    if (favoritesOnly) {
      list = list.filter((c) => favoriteIdSet.has(c.id));
    }
    return list;
  }, [ciclovias, mapHighlightIds, typeFilter, safetyFilter, favoritesOnly, favoriteIdSet]);

  const toggleTypeFilter = useCallback((key: Ciclovia["type"]) => {
    setTypeFilter((prev) => {
      const active = (Object.keys(prev) as Ciclovia["type"][]).filter((k) => prev[k]).length;
      if (prev[key] && active === 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  }, []);

  const toggleSafetyFilter = useCallback((key: Ciclovia["safety"]) => {
    setSafetyFilter((prev) => {
      const active = (Object.keys(prev) as Ciclovia["safety"][]).filter((k) => prev[k]).length;
      if (prev[key] && active === 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  }, []);

  const handleSelectCiclovia = useCallback(
    (ciclovia: Ciclovia) => {
      clearRoute();
      setSelectedCiclovia(ciclovia);
      setMapHighlightIds(null);
      setNeighborhoodName(null);
      setNeighborhoodHighlight(null);
      setSidebarOpen(true);
      setFlyTo(midpoint(ciclovia));
    },
    [clearRoute],
  );

  const handleSelectNeighborhood = useCallback(
    (name: string, list: Ciclovia[]) => {
      clearRoute();
      setSelectedCiclovia(null);
      setSidebarOpen(false);
      setFlyTo(null);
      setNeighborhoodName(name);
      setMapHighlightIds(list.map((c) => c.id));
      const shape = neighborhoodHighlightShape(list);
      if (shape) {
        neighborhoodFitSeq.current += 1;
        setNeighborhoodHighlight({
          outline: shape.outline,
          bounds: shape.bounds,
          key: `${name}-${neighborhoodFitSeq.current}`,
        });
      } else {
        setNeighborhoodHighlight(null);
      }
    },
    [clearRoute],
  );

  const handleClose = useCallback(() => {
    setSelectedCiclovia(null);
    setSidebarOpen(false);
    setMapHighlightIds(null);
    setNeighborhoodName(null);
    setNeighborhoodHighlight(null);
  }, []);

  useEffect(() => {
    if (isLoading || urlReady) return;

    const cicloviaId = searchParams.get("ciclovia");
    const bairroRaw = searchParams.get("bairro");
    const from = decodeRoutePoint(searchParams.get("from"));
    const to = decodeRoutePoint(searchParams.get("to"));
    const tipo = searchParams.get("tipo");
    const seg = searchParams.get("seg");
    const map = searchParams.get("map");

    setTypeFilter(decodeTypeFilter(tipo));
    setSafetyFilter(decodeSafetyFilter(seg));
    setBaseLayer(parseBaseLayer(map));

    if (from || to) {
      if (from) setRoutePointA(from);
      if (to) setRoutePointB(to);
    } else if (cicloviaId) {
      const c = ciclovias.find((x) => x.id === cicloviaId);
      if (c) {
        setSelectedCiclovia(c);
        setMapHighlightIds(null);
        setNeighborhoodName(null);
        setNeighborhoodHighlight(null);
        setSidebarOpen(true);
        setFlyTo(midpoint(c));
      }
    } else if (bairroRaw) {
      let name: string;
      try {
        name = decodeURIComponent(bairroRaw);
      } catch {
        name = bairroRaw;
      }
      const list = ciclovias.filter((x) => x.neighborhood === name);
      if (list.length > 0) {
        setSelectedCiclovia(null);
        setSidebarOpen(false);
        setFlyTo(null);
        setNeighborhoodName(name);
        setMapHighlightIds(list.map((c) => c.id));
        const shape = neighborhoodHighlightShape(list);
        if (shape) {
          neighborhoodFitSeq.current += 1;
          setNeighborhoodHighlight({
            outline: shape.outline,
            bounds: shape.bounds,
            key: `${name}-${neighborhoodFitSeq.current}`,
          });
        }
      }
    }

    setUrlReady(true);
  }, [isLoading, urlReady, ciclovias, searchParams]);

  useEffect(() => {
    if (!urlReady) return;
    const next = new URLSearchParams();
    if (routePointA || routePointB) {
      if (routePointA) next.set("from", encodeRoutePoint(routePointA));
      if (routePointB) next.set("to", encodeRoutePoint(routePointB));
    } else if (selectedCiclovia) {
      next.set("ciclovia", selectedCiclovia.id);
    } else if (neighborhoodName) {
      next.set("bairro", encodeURIComponent(neighborhoodName));
    }
    const tipoEnc = encodeTypeFilter(typeFilter);
    if (tipoEnc) next.set("tipo", tipoEnc);
    const segEnc = encodeSafetyFilter(safetyFilter);
    if (segEnc) next.set("seg", segEnc);
    const mapEnc = baseLayerToParam(baseLayer);
    if (mapEnc) next.set("map", mapEnc);
    setSearchParams(next, { replace: true });
  }, [
    urlReady,
    routePointA,
    routePointB,
    selectedCiclovia,
    neighborhoodName,
    typeFilter,
    safetyFilter,
    baseLayer,
    setSearchParams,
  ]);

  useEffect(() => {
    if (geoError) {
      toast.error(geoError.message, { duration: 6000 });
    }
  }, [geoError]);

  useEffect(() => {
    if (geoPosition) {
      setUserLocation(geoPosition);
      setFlyTo(geoPosition);
      clearGeoError();
    }
  }, [geoPosition, clearGeoError]);

  const weatherData = weatherQuery.data ?? mockWeather;
  const weatherLoading = weatherQuery.isLoading && !weatherQuery.data;
  const weatherFallback = weatherQuery.isError;

  return (
    <div
      className={cn(
        "relative h-screen w-screen overflow-hidden bg-background",
        baseLayer === "light" && "light-map-ui",
      )}
    >
      {/* Map */}
      <div className="absolute inset-0 z-0">
        {isLoading && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-background/40 backdrop-blur-[2px] pointer-events-none">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground bg-card/90 px-3 py-2 rounded-lg border border-border/60 shadow-sm">
              Carregando rede cicloviária…
            </p>
          </div>
        )}
        <CycleMap
          ciclovias={visibleCiclovias}
          showParks={parksVisible}
          selectedId={selectedCiclovia?.id ?? null}
          highlightedIds={mapHighlightIds}
          onSelect={handleSelectCiclovia}
          flyTo={flyTo}
          neighborhoodHighlight={neighborhoodHighlight}
          baseLayer={baseLayer}
          userLocation={userLocation}
          routePickMode={routePickMode}
          onRouteMapClick={handleRouteMapClick}
          routeLinePositions={routeLinePositions}
          routePointA={routePointA}
          routePointB={routePointB}
        />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 max-w-screen-xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel flex items-center gap-2.5 px-3 py-3 sm:px-4 flex-shrink-0"
          >
            <Bike className="w-5 h-5 text-primary shrink-0" />
            <span className="font-bold text-foreground text-sm hidden sm:inline">CicloMap CWB</span>
            <span className="hidden h-6 w-px bg-border/60 sm:block" aria-hidden />
            <button
              type="button"
              onClick={() => requestPosition()}
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              aria-label="Onde estou — centralizar mapa na minha localização"
              title="Minha localização"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </motion.div>

          <div className="flex flex-1 min-w-0 items-center gap-2 flex-wrap">
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex min-h-12 flex-1 min-w-[12rem] max-w-md items-stretch"
            >
              <SearchBar
                ciclovias={ciclovias}
                onSelectCiclovia={handleSelectCiclovia}
                onSelectNeighborhood={handleSelectNeighborhood}
                favoriteIds={favoriteIdSet}
                onToggleFavorite={toggleFavorite}
                route={{
                  pickMode: routePickMode,
                  onPickModeChange: setRoutePickMode,
                  onClear: clearRoute,
                  labelA: routeLabelA,
                  labelB: routeLabelB,
                  distanceMeters: routeDistanceM,
                  durationSeconds: routeDurationS,
                  loading: routeLoading,
                  error: routeError,
                  elevationLoading,
                  elevationError,
                  elevationData,
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="flex min-h-12 min-w-0 flex-wrap items-stretch gap-2"
            >
              <MapLayerFiltersPopover
                baseLayer={baseLayer}
                onBaseLayerChange={setBaseLayer}
                parksVisible={parksVisible}
                onParksVisibleChange={setParksVisible}
                typeFilter={typeFilter}
                onToggleType={toggleTypeFilter}
                safetyFilter={safetyFilter}
                onToggleSafety={toggleSafetyFilter}
                favoritesOnly={favoritesOnly}
                onFavoritesOnlyChange={setFavoritesOnly}
                favoriteCount={favoriteIdsArr.length}
              />
            </motion.div>
          </div>

           {/* Stats da rede + ranking de bairros */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="shrink-0 w-full sm:w-auto flex flex-wrap items-stretch justify-end gap-2"
          >
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title={
                    neighborhoodName
                      ? `Trechos visíveis: ${visibleCiclovias.length}. Recorte: ${neighborhoodName}.`
                      : undefined
                  }
                  className={cn(
                    "glass-panel box-border flex h-12 w-full shrink-0 items-center justify-center gap-2 px-3 sm:w-auto sm:justify-start sm:gap-3 sm:px-4",
                    "hover:bg-secondary/25 transition-colors text-left text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
                  )}
                  aria-label="Estatísticas dos trechos visíveis no mapa — toque para ver detalhes"
                >
                  <div className="flex min-w-0 flex-col items-center justify-center gap-0.5 leading-none sm:items-start">
                    <p className="text-base font-bold tabular-nums text-primary font-mono">{visibleCiclovias.length}</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Rotas</p>
                  </div>
                  <div className="h-6 w-px shrink-0 bg-border/50" aria-hidden />
                  <div className="flex min-w-0 flex-col items-center justify-center gap-0.5 leading-none sm:items-start">
                    <p className="text-base font-bold tabular-nums text-foreground font-mono">
                      {visibleCiclovias.length
                        ? visibleCiclovias.reduce((acc, c) => acc + c.length, 0).toFixed(0)
                        : "—"}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">km total</p>
                  </div>
                  <div className="hidden h-6 w-px shrink-0 bg-border/50 lg:block" aria-hidden />
                  <div className="hidden min-w-0 max-w-[5.5rem] flex-col justify-center gap-0 leading-tight lg:flex">
                    <p className="text-[9px] font-medium uppercase tracking-wider text-primary/90">
                      {loadMode === "live"
                        ? "IPPUC ao vivo"
                        : loadMode === "static-fallback"
                          ? "Fallback local"
                          : "Referência local"}
                    </p>
                    <p className="truncate text-[8px] text-muted-foreground">
                      {loadMode === "static-fallback"
                        ? "URL indisponível"
                        : loadMode === "live"
                          ? "GeoCuritiba"
                          : "Sem VITE_URL"}
                    </p>
                  </div>
                  <div className="hidden items-center gap-1 lg:flex">
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground lg:hidden" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-80 z-[100] max-h-[min(75vh,28rem)] overflow-y-auto p-3 sm:p-4"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <CityStatsPanel ciclovias={visibleCiclovias} embedded />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "glass-panel box-border flex h-12 shrink-0 items-center justify-center gap-2 px-3 sm:px-4",
                    "hover:bg-secondary/25 transition-colors text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
                  )}
                  aria-label="Ranking de bairros — extensão e tipos de ciclovia"
                >
                  <BarChart3 className="h-5 w-5 shrink-0 text-primary" />
                  <span className="hidden text-sm font-medium sm:inline">Bairros</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[min(100vw-2rem,36rem)] z-[100] max-h-[min(80vh,32rem)] overflow-y-auto overflow-x-hidden p-3 sm:p-4 scrollbar-themed [scrollbar-gutter:stable]"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <NeighborhoodRankingPanel ciclovias={ciclovias} />
              </PopoverContent>
            </Popover>
          </motion.div>
        </div>
      </div>

      {/* Clima + legenda + fontes — esquerda; no mobile só o clima (legenda no menu) */}
      <div
        className={cn(
          "absolute z-10 w-64 max-w-[min(16rem,calc(100vw-5rem))] left-4 space-y-3",
          "bottom-20 md:bottom-4",
          "max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden",
        )}
      >
        <WeatherPanel
          weather={weatherData}
          isLoading={weatherLoading}
          isFallback={weatherFallback}
        />
        <div className="hidden md:block space-y-3">
          <MapLegend
            onOpenTipologias={() => setTipologiasOpen(true)}
            parksVisible={parksVisible}
          />
          <SourcesPanel onOpenTipologias={() => setTipologiasOpen(true)} />
        </div>
      </div>

      {/* Right Panel - Detail */}
      <AnimatePresence>
        {selectedCiclovia && (
          <div className="absolute top-20 right-4 z-10 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <CicloviaDetail
              ciclovia={selectedCiclovia}
              onClose={handleClose}
              isFavorite={isFavorite(selectedCiclovia.id)}
              onToggleFavorite={() => toggleFavorite(selectedCiclovia.id)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute bottom-4 right-4 z-10 md:hidden glass-panel p-3"
        aria-expanded={sidebarOpen}
        aria-label={sidebarOpen ? "Fechar painel" : "Abrir painel"}
      >
        {sidebarOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
      </button>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-0 left-0 right-0 z-20 md:hidden glass-panel rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto"
          >
            <div className="space-y-3">
              {selectedCiclovia && (
                <CicloviaDetail
                  ciclovia={selectedCiclovia}
                  onClose={handleClose}
                  isFavorite={isFavorite(selectedCiclovia.id)}
                  onToggleFavorite={() => toggleFavorite(selectedCiclovia.id)}
                />
              )}
              <MapLegend
                onOpenTipologias={() => setTipologiasOpen(true)}
                parksVisible={parksVisible}
              />
              <MapLayerFiltersPopover
                baseLayer={baseLayer}
                onBaseLayerChange={setBaseLayer}
                parksVisible={parksVisible}
                onParksVisibleChange={setParksVisible}
                typeFilter={typeFilter}
                onToggleType={toggleTypeFilter}
                safetyFilter={safetyFilter}
                onToggleSafety={toggleSafetyFilter}
                favoritesOnly={favoritesOnly}
                onFavoritesOnlyChange={setFavoritesOnly}
                favoriteCount={favoriteIdsArr.length}
              />
              <SourcesPanel onOpenTipologias={() => setTipologiasOpen(true)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TipologiasModal open={tipologiasOpen} onOpenChange={setTipologiasOpen} />
    </div>
  );
};

export default Index;
