import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bike, Menu, X, Navigation } from "lucide-react";
import { toast } from "sonner";
import { LatLngExpression, type LatLngTuple, type LatLngBounds } from "leaflet";
import CycleMap from "@/components/CycleMap";
import SearchBar from "@/components/SearchBar";
import { midpoint, neighborhoodHighlightShape } from "@/utils/mapBounds";
import WeatherPanel from "@/components/WeatherPanel";
import CicloviaDetail from "@/components/CicloviaDetail";
import MapLegend from "@/components/MapLegend";
import SourcesPanel from "@/components/SourcesPanel";
import { TipologiasModal } from "@/components/shared/TipologiasModal";
import { mockWeather, Ciclovia } from "@/data/ciclovias";
import { loadCiclovias } from "@/services/cicloviasSource";
import { fetchCuritibaWeather } from "@/services/weather";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  encodeTypeFilter,
  encodeSafetyFilter,
  decodeTypeFilter,
  decodeSafetyFilter,
  parseBaseLayer,
  baseLayerToParam,
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
  const [typeFilter, setTypeFilter] = useState(defaultTypeFilter);
  const [safetyFilter, setSafetyFilter] = useState(defaultSafetyFilter);
  const [baseLayer, setBaseLayer] = useState<BaseLayerId>("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tipologiasOpen, setTipologiasOpen] = useState(false);
  const [urlReady, setUrlReady] = useState(false);

  const { position: geoPosition, error: geoError, requestPosition, clearError: clearGeoError } =
    useGeolocation();

  const visibleCiclovias = useMemo(() => {
    let list = ciclovias;
    if (mapHighlightIds) {
      const idSet = new Set(mapHighlightIds);
      list = list.filter((c) => idSet.has(c.id));
    }
    return list.filter((c) => typeFilter[c.type] && safetyFilter[c.safety]);
  }, [ciclovias, mapHighlightIds, typeFilter, safetyFilter]);

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

  const handleSelectCiclovia = useCallback((ciclovia: Ciclovia) => {
    setSelectedCiclovia(ciclovia);
    setMapHighlightIds(null);
    setNeighborhoodName(null);
    setNeighborhoodHighlight(null);
    setSidebarOpen(true);
    setFlyTo(midpoint(ciclovia));
  }, []);

  const handleSelectNeighborhood = useCallback((name: string, list: Ciclovia[]) => {
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
  }, []);

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
    const tipo = searchParams.get("tipo");
    const seg = searchParams.get("seg");
    const map = searchParams.get("map");

    setTypeFilter(decodeTypeFilter(tipo));
    setSafetyFilter(decodeSafetyFilter(seg));
    setBaseLayer(parseBaseLayer(map));

    if (cicloviaId) {
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
    if (selectedCiclovia) next.set("ciclovia", selectedCiclovia.id);
    else if (neighborhoodName) next.set("bairro", encodeURIComponent(neighborhoodName));
    const tipoEnc = encodeTypeFilter(typeFilter);
    if (tipoEnc) next.set("tipo", tipoEnc);
    const segEnc = encodeSafetyFilter(safetyFilter);
    if (segEnc) next.set("seg", segEnc);
    const mapEnc = baseLayerToParam(baseLayer);
    if (mapEnc) next.set("map", mapEnc);
    setSearchParams(next, { replace: true });
  }, [
    urlReady,
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
        />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center gap-3 max-w-screen-xl mx-auto">
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
              onClick={() => setTipologiasOpen(true)}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
            >
              Tipologias
            </button>
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

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 max-w-md"
          >
            <SearchBar
              ciclovias={ciclovias}
              onSelectCiclovia={handleSelectCiclovia}
              onSelectNeighborhood={handleSelectNeighborhood}
            />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel-sm px-4 py-2.5 hidden md:flex items-center gap-4"
          >
            <div className="text-center min-w-[3.5rem]">
              <p className="text-lg font-bold text-primary font-mono">{visibleCiclovias.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rotas</p>
              {neighborhoodName && (
                <p
                  className="text-[9px] text-muted-foreground/90 mt-0.5 leading-tight max-w-[7rem] truncate"
                  title={neighborhoodName}
                >
                  {neighborhoodName}
                </p>
              )}
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="text-center">
              <p className="text-lg font-bold text-foreground font-mono">
                {visibleCiclovias.length
                  ? visibleCiclovias.reduce((acc, c) => acc + c.length, 0).toFixed(0)
                  : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">km total</p>
            </div>
            <div className="w-px h-8 bg-border/50 hidden lg:block" />
            <div className="hidden lg:block text-center min-w-[4.5rem]">
              <p className="text-[10px] font-medium text-primary/90 uppercase tracking-wider leading-tight">
                {loadMode === "live"
                  ? "IPPUC ao vivo"
                  : loadMode === "static-fallback"
                    ? "Fallback local"
                    : "Referência local"}
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">
                {loadMode === "static-fallback"
                  ? "URL indisponível"
                  : loadMode === "live"
                    ? "GeoCuritiba"
                    : "Sem VITE_URL"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Left Panel - Weather + Legend */}
      <div className="absolute bottom-4 left-4 z-10 space-y-3 w-64 hidden md:block max-h-[calc(100vh-8rem)] overflow-y-auto">
        <WeatherPanel
          weather={weatherData}
          isLoading={weatherLoading}
          isFallback={weatherFallback}
        />
        <MapLegend
          onOpenTipologias={() => setTipologiasOpen(true)}
          parksVisible={parksVisible}
          onParksVisibleChange={setParksVisible}
          typeFilter={typeFilter}
          onToggleType={toggleTypeFilter}
          safetyFilter={safetyFilter}
          onToggleSafety={toggleSafetyFilter}
          baseLayer={baseLayer}
          onBaseLayerChange={setBaseLayer}
        />
        <SourcesPanel onOpenTipologias={() => setTipologiasOpen(true)} />
      </div>

      {/* Right Panel - Detail */}
      <AnimatePresence>
        {selectedCiclovia && (
          <div className="absolute top-20 right-4 z-10 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <CicloviaDetail ciclovia={selectedCiclovia} onClose={handleClose} />
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
              <WeatherPanel
                weather={weatherData}
                isLoading={weatherLoading}
                isFallback={weatherFallback}
              />
              {selectedCiclovia && (
                <CicloviaDetail ciclovia={selectedCiclovia} onClose={handleClose} />
              )}
              <MapLegend
                onOpenTipologias={() => setTipologiasOpen(true)}
                parksVisible={parksVisible}
                onParksVisibleChange={setParksVisible}
                typeFilter={typeFilter}
                onToggleType={toggleTypeFilter}
                safetyFilter={safetyFilter}
                onToggleSafety={toggleSafetyFilter}
                baseLayer={baseLayer}
                onBaseLayerChange={setBaseLayer}
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
