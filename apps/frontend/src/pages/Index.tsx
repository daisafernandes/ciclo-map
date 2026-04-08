import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bike, Menu, X } from "lucide-react";
import { LatLngExpression } from "leaflet";
import CycleMap from "@/components/CycleMap";
import SearchBar from "@/components/SearchBar";
import WeatherPanel from "@/components/WeatherPanel";
import CicloviaDetail from "@/components/CicloviaDetail";
import MapLegend from "@/components/MapLegend";
import { ciclovias, mockWeather, Ciclovia } from "@/data/ciclovias";

const Index = () => {
  const [selectedCiclovia, setSelectedCiclovia] = useState<Ciclovia | null>(null);
  const [flyTo, setFlyTo] = useState<LatLngExpression | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelect = useCallback((ciclovia: Ciclovia) => {
    setSelectedCiclovia(ciclovia);
    setSidebarOpen(true);
    const midIndex = Math.floor(ciclovia.coordinates.length / 2);
    setFlyTo(ciclovia.coordinates[midIndex]);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedCiclovia(null);
    setSidebarOpen(false);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Map */}
      <div className="absolute inset-0 z-0">
        <CycleMap
          ciclovias={ciclovias}
          selectedId={selectedCiclovia?.id ?? null}
          onSelect={handleSelect}
          flyTo={flyTo}
        />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center gap-3 max-w-screen-xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
          >
            <Bike className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground text-sm hidden sm:inline">CicloMap CWB</span>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 max-w-md"
          >
            <SearchBar ciclovias={ciclovias} onSelect={handleSelect} />
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
                {ciclovias.reduce((acc, c) => acc + c.length, 0).toFixed(0)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">km total</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Left Panel - Weather + Legend */}
      <div className="absolute bottom-4 left-4 z-10 space-y-3 w-64 hidden md:block">
        <WeatherPanel weather={mockWeather} />
        <MapLegend />
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
              <MapLegend />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
