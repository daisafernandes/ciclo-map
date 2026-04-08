import { useQuery } from "@tanstack/react-query";
import { GeoJSON } from "react-leaflet";
import { fetchCuritibaParksGeoJson } from "@/services/parksOverpass";

const parkStyle = {
  fillColor: "#22c55e",
  fillOpacity: 0.32,
  color: "#15803d",
  weight: 1,
  opacity: 0.85,
} as const;

/**
 * Polígonos de parques (OSM) por baixo das ciclovias — só realce verde, sem roubar cliques.
 */
const ParksOverlay = () => {
  const { data } = useQuery({
    queryKey: ["osm-parks-curitiba"],
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
