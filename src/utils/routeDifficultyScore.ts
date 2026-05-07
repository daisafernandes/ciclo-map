import type { ElevationProfilePoint } from "@/services/elevation";
import type { WeatherData } from "@/data/ciclovias";
import type { RouteNetworkMode } from "@/utils/mapUrlParams";

export type DifficultyLevel = "Fácil" | "Moderado" | "Difícil";

export interface RouteDifficultyResult {
  level: DifficultyLevel;
  score: number;
  elevationGainM: number;
  factors: string[];
}

function calcElevationGain(data: ElevationProfilePoint[]): number {
  let gain = 0;
  for (let i = 1; i < data.length; i++) {
    const diff = data[i].elevationM - data[i - 1].elevationM;
    if (diff > 0) gain += diff;
  }
  return gain;
}

export function calculateRouteDifficulty(params: {
  elevationData: ElevationProfilePoint[];
  distanceMeters: number;
  weatherData?: WeatherData;
  routeNetworkMode: RouteNetworkMode;
}): RouteDifficultyResult {
  const { elevationData, distanceMeters, weatherData, routeNetworkMode } = params;
  const factors: string[] = [];

  const elevationGainM = calcElevationGain(elevationData);
  const distKm = distanceMeters / 1000 || 1;

  // Elevação: ganho total / (distância × 10), normalizado 0–50
  const elevRatio = elevationGainM / (distKm * 10);
  const elevScore = Math.min(50, elevRatio * 50);
  if (elevationGainM > 80) factors.push(`${Math.round(elevationGainM)} m de subida`);

  // Tipo de rede: OSRM usa vias mistas, IPPUC usa infraestrutura dedicada
  const networkScore = routeNetworkMode === "osrm" ? 10 : 0;
  if (routeNetworkMode === "osrm") factors.push("Vias mistas (OSM)");

  // Chuva
  const rain = weatherData?.rain ?? 0;
  let rainScore = 0;
  if (rain >= 1.5) {
    rainScore = 20;
    factors.push("Chuva intensa");
  } else if (rain >= 0.3) {
    rainScore = 10;
    factors.push("Chuva leve");
  }

  // Vento
  const wind = weatherData?.windSpeed ?? 0;
  let windScore = 0;
  if (wind >= 35) {
    windScore = 10;
    factors.push("Vento forte");
  } else if (wind >= 25) {
    windScore = 5;
    factors.push("Vento moderado");
  }

  const score = Math.min(100, elevScore + networkScore + rainScore + windScore);

  let level: DifficultyLevel;
  if (score <= 30) level = "Fácil";
  else if (score <= 60) level = "Moderado";
  else level = "Difícil";

  return { level, score, elevationGainM, factors };
}
