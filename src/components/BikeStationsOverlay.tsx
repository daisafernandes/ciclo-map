import { useQuery } from "@tanstack/react-query";
import { CircleMarker, Tooltip } from "react-leaflet";
import { fetchCuritibaBikeStations } from "@/services/bicicuritibaBikeStations";

const STATION_COLOR = "#3b82f6";

const BikeStationsOverlay = () => {
  const { data } = useQuery({
    queryKey: ["osm-bike-stations-curitiba"],
    queryFn: async () => {
      try {
        return await fetchCuritibaBikeStations();
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });

  if (!data || data.length === 0) return null;

  return (
    <>
      {data.map((station) => (
        <CircleMarker
          key={station.id}
          center={station.position}
          radius={7}
          pathOptions={{
            color: STATION_COLOR,
            fillColor: STATION_COLOR,
            fillOpacity: 0.85,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            <span className="text-xs font-medium">{station.name}</span>
            {station.operator && (
              <span className="block text-[10px] text-muted-foreground">{station.operator}</span>
            )}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
};

export default BikeStationsOverlay;
