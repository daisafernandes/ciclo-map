import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  Popup,
  CircleMarker,
  Marker,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L, { LatLngExpression, type LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Ciclovia, getSafetyLabel, getTypeLabel, SAFETY_COLORS } from "@/data/ciclovias";
import ParksOverlay from "@/components/ParksOverlay";
import BikeStationsOverlay from "@/components/BikeStationsOverlay";
import { flattenBoundsPoints } from "@/utils/mapBounds";
import type { BaseLayerId } from "@/utils/mapUrlParams";
import type { RoutePickMode } from "@/components/RoutePlannerPanel";

const BASE_LAYERS: Record<
  BaseLayerId,
  { url: string; attribution: string }
> = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },
};


const typeStyles = {
  ciclovia: { weight: 5, opacity: 0.9, dashArray: undefined },
  ciclofaixa: { weight: 4, opacity: 0.8, dashArray: "10 6" },
  ciclorrota: { weight: 3, opacity: 0.7, dashArray: "4 8" },
};

const routePointIcons = {
  origin: L.divIcon({
    className: "route-point-marker",
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#4ade80;border:2px solid #22c55e;box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  }),
  dest: L.divIcon({
    className: "route-point-marker",
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#fca5a5;border:2px solid #ef4444;box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  }),
  waypoint: L.divIcon({
    className: "route-point-marker",
    html: '<div style="width:12px;height:12px;border-radius:50%;background:#fcd34d;border:2px solid #d97706;box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  }),
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

const RouteMapClickHandler = ({
  pickMode,
  onMapClick,
}: {
  pickMode: RoutePickMode;
  onMapClick: (p: LatLngTuple) => void;
}) => {
  const map = useMap();
  useMapEvents({
    click: (e) => {
      if (pickMode === "none") return;
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  useEffect(() => {
    const el = map.getContainer();
    if (pickMode !== "none") {
      el.style.cursor = "crosshair";
    } else {
      el.style.cursor = "";
    }
    return () => {
      el.style.cursor = "";
    };
  }, [map, pickMode]);
  return null;
};

const FitBoundsToCiclovias = ({
  ciclovias,
  resetKey = 0,
}: {
  ciclovias: Ciclovia[];
  /** Incrementar para forçar novo fit (ex.: ao fechar busca / detalhe). */
  resetKey?: number;
}) => {
  const map = useMap();
  const contentKey = useMemo(
    () => `${ciclovias.length}-${ciclovias[0]?.id ?? ""}-${ciclovias.at(-1)?.id ?? ""}`,
    [ciclovias],
  );
  const lastContentKey = useRef<string | null>(null);
  const lastResetKey = useRef(resetKey);

  useEffect(() => {
    if (ciclovias.length === 0) return;
    const pts = flattenBoundsPoints(ciclovias);
    if (pts.length === 0) return;
    const resetBumped = resetKey !== lastResetKey.current;
    const listChanged = lastContentKey.current !== contentKey;
    if (!resetBumped && !listChanged) return;
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 14 });
    lastContentKey.current = contentKey;
    lastResetKey.current = resetKey;
  }, [ciclovias, contentKey, map, resetKey]);

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
  /** Polígonos de parques OSM (só quando true). */
  showParks?: boolean;
  showBikeStations?: boolean;
  selectedId: string | null;
  /** Quando definido (ex.: busca por bairro), destaca vários trechos. Se vazio, usa só `selectedId`. */
  highlightedIds?: string[] | null;
  onSelect: (ciclovia: Ciclovia) => void;
  flyTo: LatLngExpression | null;
  /** Contorno do bairro (fecho convexo dos trechos) + bounds para o fit. */
  neighborhoodHighlight?: { outline: L.LatLngTuple[]; bounds: L.LatLngBounds; key: string } | null;
  /** Camada de mapa-base (tiles). */
  baseLayer?: BaseLayerId;
  /** Posição do usuário (geolocalização), exibida como marcador discreto. */
  userLocation?: LatLngTuple | null;
  /** Modo de clique para definir origem/destino da rota OSRM. */
  routePickMode?: RoutePickMode;
  onRouteMapClick?: (p: LatLngTuple) => void;
  /** Quando false, não desenha a polyline calculada (ex.: modo de escolher ponto no mapa). */
  showRouteLine?: boolean;
  routeLinePositions?: LatLngTuple[] | null;
  /** Rotas alternativas (ex.: OSRM); a ativa é `routeLinePositions` / `selectedRouteAlternativeIndex`. */
  routeLineAlternatives?: LatLngTuple[][] | null;
  selectedRouteAlternativeIndex?: number;
  /** Trechos estimados fora da rede IPPUC (reta usuário → rede). */
  routeOffNetworkSegments?: { a: LatLngTuple; b: LatLngTuple }[];
  /** Ordem: origem, paradas opcionais, destino. */
  routePoints?: LatLngTuple[];
  onRoutePointDragEnd?: (index: number, latlng: LatLngTuple) => void;
  /** Incrementar para recentrar a vista na rede visível (fechar busca / detalhe). */
  cityFitResetKey?: number;
}

const CycleMap = ({
  ciclovias,
  showParks = false,
  showBikeStations = false,
  selectedId,
  highlightedIds = null,
  onSelect,
  flyTo,
  neighborhoodHighlight = null,
  baseLayer = "dark",
  userLocation = null,
  routePickMode = "none",
  onRouteMapClick,
  showRouteLine = true,
  routeLinePositions = null,
  routeLineAlternatives = null,
  selectedRouteAlternativeIndex = 0,
  routeOffNetworkSegments,
  routePoints = [],
  onRoutePointDragEnd,
  cityFitResetKey = 0,
}: CycleMapProps) => {
  const curitibaCenter: LatLngExpression = [-25.4284, -49.2733];
  const tile = BASE_LAYERS[baseLayer];
  const cicloviasInteractive = routePickMode === "none";
  const markersDraggable = Boolean(onRoutePointDragEnd) && routePickMode === "none";

  return (
    <MapContainer
      center={curitibaCenter}
      zoom={13}
      className="h-full w-full"
      zoomControl={false}
      attributionControl={true}
    >
      <ZoomControl position="bottomright" />
      <TileLayer key={baseLayer} attribution={tile.attribution} url={tile.url} />
      {showParks ? <ParksOverlay /> : null}
      {showBikeStations ? <BikeStationsOverlay /> : null}
      {onRouteMapClick ? (
        <RouteMapClickHandler pickMode={routePickMode} onMapClick={onRouteMapClick} />
      ) : null}
      {userLocation ? (
        <CircleMarker
          center={userLocation}
          radius={9}
          pathOptions={{
            color: "#0ea5e9",
            weight: 3,
            fillColor: "#38bdf8",
            fillOpacity: 0.35,
          }}
        >
          <Popup>
            <span className="text-xs">Sua localização aproximada</span>
          </Popup>
        </CircleMarker>
      ) : null}
      <FlyToLocation center={flyTo} />
      <FitBoundsToCiclovias ciclovias={ciclovias} resetKey={cityFitResetKey} />
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
            interactive={cicloviasInteractive}
            positions={ciclovia.coordinates}
            pathOptions={{
              color: isSelected ? "#14b8a6" : SAFETY_COLORS[ciclovia.safety],
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
                    backgroundColor: SAFETY_COLORS[ciclovia.safety] + "20",
                    color: SAFETY_COLORS[ciclovia.safety],
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
      {showRouteLine && (routeOffNetworkSegments?.length ?? 0) > 0
        ? (routeOffNetworkSegments ?? []).map((seg, i) => (
            <Polyline
              key={`off-net-${i}-${seg.a[0]}-${seg.a[1]}`}
              positions={[seg.a, seg.b]}
              pathOptions={{
                color: "#94a3b8",
                weight: 4,
                opacity: 0.55,
                dashArray: "10 8",
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          ))
        : null}
      {showRouteLine &&
        routeLineAlternatives &&
        routeLineAlternatives.length > 1 &&
        routeLineAlternatives.map((positions, i) =>
          i !== selectedRouteAlternativeIndex && positions.length >= 2 ? (
            <Polyline
              key={`route-alt-${i}`}
              positions={positions}
              pathOptions={{
                color: "#6366f1",
                weight: 4,
                opacity: 0.38,
                dashArray: "8 10",
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          ) : null,
        )}
      {showRouteLine && routeLinePositions && routeLinePositions.length >= 2 && (
        <Polyline
          positions={routeLinePositions}
          pathOptions={{
            color: "#6366f1",
            weight: 5,
            opacity: 0.92,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}
      {routePoints.map((pt, i) => {
        const n = routePoints.length;
        const isOrigin = i === 0;
        const isDest = n >= 2 && i === n - 1;
        const isWaypoint = n >= 3 && !isOrigin && !isDest;
        const label =
          n === 1
            ? "Origem (rota)"
            : isOrigin
              ? "Origem (rota)"
              : isDest
                ? "Destino (rota)"
                : `Parada ${i}`;
        const icon = isOrigin ? routePointIcons.origin : isDest ? routePointIcons.dest : routePointIcons.waypoint;
        return (
          <Marker
            key={`rp-${i}`}
            position={pt}
            icon={icon}
            draggable={markersDraggable}
            eventHandlers={{
              dragend: (e) => {
                const ll = e.target.getLatLng();
                onRoutePointDragEnd?.(i, [ll.lat, ll.lng]);
              },
            }}
          >
            <Popup>
              <span className="text-xs">{label}</span>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default CycleMap;
