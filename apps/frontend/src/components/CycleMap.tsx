import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Popup, useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Ciclovia, getSafetyLabel, getTypeLabel } from "@/data/ciclovias";

const safetyColors = {
  safe: "#22c55e",
  moderate: "#eab308",
  caution: "#ef4444",
};

const typeStyles = {
  ciclovia: { weight: 5, opacity: 0.9, dashArray: undefined },
  ciclofaixa: { weight: 4, opacity: 0.8, dashArray: "10 6" },
  ciclorrota: { weight: 3, opacity: 0.7, dashArray: "4 8" },
};

interface FlyToProps {
  center: LatLngExpression | null;
}

const FlyToLocation = ({ center }: FlyToProps) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
};

interface CycleMapProps {
  ciclovias: Ciclovia[];
  selectedId: string | null;
  onSelect: (ciclovia: Ciclovia) => void;
  flyTo: LatLngExpression | null;
}

const CycleMap = ({ ciclovias, selectedId, onSelect, flyTo }: CycleMapProps) => {
  const curitibaCenter: LatLngExpression = [-25.4284, -49.2733];

  return (
    <MapContainer
      center={curitibaCenter}
      zoom={13}
      className="h-full w-full"
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://stadiamaps.com/">Stadia</a>'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
      />
      <FlyToLocation center={flyTo} />
      {ciclovias.map((ciclovia) => {
        const style = typeStyles[ciclovia.type];
        const isSelected = selectedId === ciclovia.id;
        const safety = getSafetyLabel(ciclovia.safety);

        return (
          <Polyline
            key={ciclovia.id}
            positions={ciclovia.coordinates}
            pathOptions={{
              color: isSelected ? "#14b8a6" : safetyColors[ciclovia.safety],
              weight: isSelected ? style.weight + 2 : style.weight,
              opacity: isSelected ? 1 : style.opacity,
              dashArray: style.dashArray,
            }}
            eventHandlers={{
              click: () => onSelect(ciclovia),
            }}
          >
            <Popup>
              <div className="min-w-[200px] p-1">
                <h3 className="font-bold text-sm mb-1">{ciclovia.name}</h3>
                <p className="text-xs opacity-80 mb-2">{ciclovia.street}</p>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    {getTypeLabel(ciclovia.type)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full`} style={{
                    backgroundColor: safetyColors[ciclovia.safety] + "20",
                    color: safetyColors[ciclovia.safety],
                  }}>
                    {safety.label}
                  </span>
                </div>
                <p className="text-xs mt-2 opacity-70">{ciclovia.length} km</p>
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </MapContainer>
  );
};

export default CycleMap;
