import { useQuery } from "@tanstack/react-query";
import { GeoJSON } from "react-leaflet";
import { fetchCuritibaParksGeoJson, MIN_LARGE_PARK_AREA_M2 } from "@/services/parksOverpass";

/** Contraste no mapa escuro (CARTO dark): preenchimento visível sem tapar ruas. */
const parkStyle = {
  fillColor: "#4ade80",
  fillOpacity: 0.45,
  color: "#22c55e",
  weight: 1.25,
  opacity: 0.95,
} as const;

/**
 * Polígonos de parques (OSM) por baixo das ciclovias — só realce verde, sem roubar cliques.
 */
const ParksOverlay = () => {
  const { data } = useQuery({
    queryKey: ["osm-parks-curitiba", "large", MIN_LARGE_PARK_AREA_M2],
    queryFn: async () => {
      try {
        return await fetchCuritibaParksGeoJson();
      } catch {
        return { type: "FeatureCollection" as const, features: [] };
      }
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });

  if (!data || data.features.length === 0) return null;

  return <GeoJSON data={data} interactive={false} style={parkStyle} />;
};

export default ParksOverlay;
