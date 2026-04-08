import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bike, Menu, X } from "lucide-react";
import { LatLngExpression, type LatLngBounds, type LatLngTuple } from "leaflet";
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

const Index = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["ciclovias", import.meta.env.VITE_CICLOVIAS_LIVE_URL ?? ""],
    queryFn: loadCiclovias,
    staleTime: 1000 * 60 * 30,
  });

  const ciclovias = data?.ciclovias ?? [];
  const loadMode = data?.mode ?? "static";

  const [selectedCiclovia, setSelectedCiclovia] = useState<Ciclovia | null>(null);
  const [flyTo, setFlyTo] = useState<LatLngExpression | null>(null);
  const [mapHighlightIds, setMapHighlightIds] = useState<string[] | null>(null);
  const [neighborhoodHighlight, setNeighborhoodHighlight] = useState<{
    outline: LatLngTuple[];
    bounds: LatLngBounds;
    key: string;
  } | null>(null);
  const neighborhoodFitSeq = useRef(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tipologiasOpen, setTipologiasOpen] = useState(false);

  const handleSelectCiclovia = useCallback((ciclovia: Ciclovia) => {
    setSelectedCiclovia(ciclovia);
    setMapHighlightIds(null);
    setNeighborhoodHighlight(null);
    setSidebarOpen(true);
    setFlyTo(midpoint(ciclovia));
  }, []);

  const handleSelectNeighborhood = useCallback((name: string, list: Ciclovia[]) => {
    setSelectedCiclovia(null);
    setSidebarOpen(false);
    setFlyTo(null);
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
    setNeighborhoodHighlight(null);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
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
          ciclovias={ciclovias}
          selectedId={selectedCiclovia?.id ?? null}
          highlightedIds={mapHighlightIds}
          onSelect={handleSelectCiclovia}
          flyTo={flyTo}
          neighborhoodHighlight={neighborhoodHighlight}
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
            <div className="text-center">
              <p className="text-lg font-bold text-primary font-mono">{ciclovias.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rotas</p>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="text-center">
              <p className="text-lg font-bold text-foreground font-mono">
                {ciclovias.length ? ciclovias.reduce((acc, c) => acc + c.length, 0).toFixed(0) : "—"}
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
                {loadMode === "static-fallback" ? "URL indisponível" : loadMode === "live" ? "GeoCuritiba" : "Sem VITE_URL"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Left Panel - Weather + Legend */}
      <div className="absolute bottom-4 left-4 z-10 space-y-3 w-64 hidden md:block max-h-[calc(100vh-8rem)] overflow-y-auto">
        <WeatherPanel weather={mockWeather} />
        <MapLegend onOpenTipologias={() => setTipologiasOpen(true)} />
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
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute bottom-4 right-4 z-10 md:hidden glass-panel p-3"
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
              <WeatherPanel weather={mockWeather} />
              {selectedCiclovia && (
                <CicloviaDetail ciclovia={selectedCiclovia} onClose={handleClose} />
              )}
              <MapLegend onOpenTipologias={() => setTipologiasOpen(true)} />
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
