import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Polygon, Popup, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Ciclovia, getSafetyLabel, getTypeLabel } from "@/data/ciclovias";
import { flattenBoundsPoints } from "@/utils/mapBounds";

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

const FitBoundsToArea = ({
  bounds,
  boundsKey,
}: {
  bounds: L.LatLngBounds | null;
  boundsKey: string | null;
}) => {
  const map = useMap();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!bounds || !boundsKey) return;
    if (lastKey.current === boundsKey) return;
    map.fitBounds(bounds, { padding: [52, 52], maxZoom: 16, animate: true });
    lastKey.current = boundsKey;
  }, [bounds, boundsKey, map]);

  return null;
};

const FitBoundsToCiclovias = ({ ciclovias }: { ciclovias: Ciclovia[] }) => {
  const map = useMap();
  const key = useMemo(
    () => `${ciclovias.length}-${ciclovias[0]?.id ?? ""}-${ciclovias.at(-1)?.id ?? ""}`,
    [ciclovias],
  );
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (ciclovias.length === 0) return;
    if (lastKey.current === key) return;
    const pts = flattenBoundsPoints(ciclovias);
    if (pts.length === 0) return;
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 14 });
    lastKey.current = key;
  }, [ciclovias, key, map]);

  return null;
};

function isLineHighlighted(
  id: string,
  selectedId: string | null,
  highlightedIds: string[] | null,
): boolean {
  if (highlightedIds && highlightedIds.length > 0) return highlightedIds.includes(id);
  return selectedId === id;
}

interface CycleMapProps {
  ciclovias: Ciclovia[];
  selectedId: string | null;
  /** Quando definido (ex.: busca por bairro), destaca vários trechos. Se vazio, usa só `selectedId`. */
  highlightedIds?: string[] | null;
  onSelect: (ciclovia: Ciclovia) => void;
  flyTo: LatLngExpression | null;
  /** Contorno do bairro (fecho convexo dos trechos) + bounds para o fit. */
  neighborhoodHighlight?: { outline: L.LatLngTuple[]; bounds: L.LatLngBounds; key: string } | null;
}

const CycleMap = ({
  ciclovias,
  selectedId,
  highlightedIds = null,
  onSelect,
  flyTo,
  neighborhoodHighlight = null,
}: CycleMapProps) => {
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <FlyToLocation center={flyTo} />
      <FitBoundsToCiclovias ciclovias={ciclovias} />
      <FitBoundsToArea bounds={neighborhoodHighlight?.bounds ?? null} boundsKey={neighborhoodHighlight?.key ?? null} />
      {neighborhoodHighlight && neighborhoodHighlight.outline.length >= 3 && (
        <Polygon
          positions={neighborhoodHighlight.outline}
          pathOptions={{
            color: "#14b8a6",
            weight: 2,
            opacity: 0.9,
            fillColor: "#14b8a6",
            fillOpacity: 0.06,
            lineJoin: "round",
            lineCap: "round",
          }}
        />
      )}
      {ciclovias.map((ciclovia) => {
        const style = typeStyles[ciclovia.type];
        const isSelected = isLineHighlighted(ciclovia.id, selectedId, highlightedIds);
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
                    {getTypeLabel(ciclovia.type, ciclovia.tipoLabelIppuc)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full`} style={{
                    backgroundColor: safetyColors[ciclovia.safety] + "20",
                    color: safetyColors[ciclovia.safety],
                  }}>
                    {safety.label}
                  </span>
                </div>
                <p className="text-xs mt-2 opacity-70">{ciclovia.length} km</p>
                <p className="text-[10px] mt-2 pt-2 border-t border-border/50 opacity-60 leading-snug">
                  {ciclovia.dataSource === "live"
                    ? "Dados: IPPUC / GeoCuritiba."
                    : "Trechos de referência no app; confira o painel oficial em Fontes."}
                </p>
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </MapContainer>
  );
};

export default CycleMap;
