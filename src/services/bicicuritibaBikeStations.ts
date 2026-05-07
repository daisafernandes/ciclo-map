import type { LatLngTuple } from "leaflet";
import { overpassBase } from "@/lib/apiConfig";

export interface BikeStation {
  id: string;
  name: string;
  position: LatLngTuple;
  operator?: string;
  network?: string;
}

const CURITIBA_BBOX = {
  south: -25.65,
  west: -49.42,
  north: -25.25,
  east: -48.98,
} as const;

interface OverpassNode {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassNode[];
}

export async function fetchCuritibaBikeStations(): Promise<BikeStation[]> {
  const { south, west, north, east } = CURITIBA_BBOX;
  const query = `
[out:json][timeout:30];
node["amenity"="bicycle_rental"](${south},${west},${north},${east});
out body;
`;

  const res = await fetch(overpassBase(), {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!res.ok) {
    throw new Error(`Overpass HTTP ${res.status}`);
  }

  const data = (await res.json()) as OverpassResponse;
  const elements = data.elements ?? [];

  return elements
    .filter((el): el is OverpassNode => el.type === "node" && el.lat != null && el.lon != null)
    .map((el) => ({
      id: String(el.id),
      name: el.tags?.name ?? el.tags?.["name:pt"] ?? "Bicicuritiba",
      position: [el.lat, el.lon] as LatLngTuple,
      operator: el.tags?.operator,
      network: el.tags?.network,
    }));
}
