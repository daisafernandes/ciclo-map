import type { WeatherData } from "@/data/ciclovias";

/** Curitiba — alinhado ao centro do mapa */
const LAT = -25.4284;
const LON = -49.2733;

export type CyclingWeatherAlertLevel = "info" | "warning" | "danger";

export interface CyclingWeatherAlert {
  level: CyclingWeatherAlertLevel;
  message: string;
}

interface OpenMeteoCurrent {
  temperature_2m?: number;
  relative_humidity_2m?: number;
  apparent_temperature?: number;
  precipitation?: number;
  weather_code?: number;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
}

interface OpenMeteoHourly {
  time?: string[];
  precipitation?: number[];
  wind_gusts_10m?: number[];
}

interface OpenMeteoResponse {
  current?: OpenMeteoCurrent;
  hourly?: OpenMeteoHourly;
}

function degToCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(deg / 45) % 8;
  return dirs[idx];
}

/** WMO weather interpretation (Open-Meteo), simplified PT */
function weatherCodeToLabel(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: "Céu limpo", icon: "clear" };
  if (code <= 3) return { condition: "Parcialmente nublado", icon: "partly-cloudy" };
  if (code <= 48) return { condition: "Neblina", icon: "fog" };
  if (code <= 67) return { condition: "Chuva", icon: "rain" };
  if (code <= 77) return { condition: "Neve / granizo", icon: "snow" };
  if (code <= 82) return { condition: "Pancadas de chuva", icon: "rain" };
  if (code <= 86) return { condition: "Neve", icon: "snow" };
  if (code <= 99) return { condition: "Tempestade", icon: "storm" };
  return { condition: "Variável", icon: "cloud" };
}

function sumNextHours(
  hourly: OpenMeteoHourly | undefined,
  hours: number,
): { precipMm: number | undefined; maxGustKmh: number | undefined } {
  const times = hourly?.time;
  const precip = hourly?.precipitation;
  const gusts = hourly?.wind_gusts_10m;
  if (!times?.length || !precip?.length) return { precipMm: undefined, maxGustKmh: undefined };
  const now = Date.now();
  let start = times.findIndex((t) => new Date(t).getTime() >= now - 30 * 60 * 1000);
  if (start < 0) start = 0;
  const end = Math.min(start + hours, precip.length);
  let sum = 0;
  for (let i = start; i < end; i++) sum += precip[i] ?? 0;
  let maxG: number | undefined;
  if (gusts?.length) {
    for (let i = start; i < Math.min(start + hours, gusts.length); i++) {
      const g = gusts[i];
      if (typeof g === "number" && (maxG === undefined || g > maxG)) maxG = g;
    }
  }
  return {
    precipMm: Number(sum.toFixed(2)),
    maxGustKmh: maxG !== undefined ? Math.round(maxG) : undefined,
  };
}

/**
 * Alertas simples para pedalar (chuva, vento, sensação térmica).
 * Usa precipitação atual, previsão nas próximas horas e vento quando disponíveis.
 */
export function getCyclingWeatherAlerts(w: WeatherData): CyclingWeatherAlert[] {
  const alerts: CyclingWeatherAlert[] = [];
  const rainNow = w.rain;
  const rainSoon = w.precipitationNext3hMm ?? 0;
  const gust = w.maxWindGustNext3hKmh;
  const feels = w.feelsLike;
  const wind = w.windSpeed;

  const wetCondition = /\b(chuva|pancad|tempest|chuvisco|garoa|n[eé]voa)\b/i.test(w.condition);

  if (rainNow >= 1.5 || wetCondition) {
    alerts.push({
      level: "danger",
      message: "Chuva ou solo molhado — reduza velocidade e aumente distância de frenagem.",
    });
  } else if (rainNow >= 0.3) {
    alerts.push({
      level: "warning",
      message: "Precipitação leve agora; piso pode ficar escorregadio.",
    });
  }

  if (rainSoon >= 3 && rainNow < 0.5) {
    alerts.push({
      level: "warning",
      message: `Chuva prevista nas próximas horas (~${rainSoon.toFixed(1)} mm). Considere capa ou outro trajeto.`,
    });
  }

  if (gust !== undefined && gust >= 45) {
    alerts.push({
      level: "warning",
      message: `Rajadas fortes previstas (até ~${gust} km/h) — atenção em cruzamentos e pontes.`,
    });
  } else if (wind >= 35) {
    alerts.push({
      level: "warning",
      message: `Vento forte (~${wind} km/h) — pode afetar equilíbrio, principalmente de perfil.`,
    });
  } else if (wind >= 25) {
    alerts.push({
      level: "info",
      message: `Vento moderado (~${wind} km/h).`,
    });
  }

  if (feels <= 5) {
    alerts.push({
      level: "warning",
      message: "Sensação térmica baixa — luvas e proteção ao vento ajudam nas mãos.",
    });
  } else if (feels >= 32) {
    alerts.push({
      level: "warning",
      message: "Calor intenso — hidrate-se e evite horários de pico de sol, se possível.",
    });
  } else if (feels >= 28 && feels < 32) {
    alerts.push({
      level: "info",
      message: "Calor moderado — leve água.",
    });
  }

  const delta = Math.abs(w.temperature - w.feelsLike);
  if (delta >= 4) {
    alerts.push({
      level: "info",
      message: "Diferença entre temperatura e sensação — vento ou umidade alteram o conforto.",
    });
  }

  return alerts;
}

export async function fetchCuritibaWeather(): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(LAT));
  url.searchParams.set("longitude", String(LON));
  url.searchParams.set("timezone", "America/Sao_Paulo");
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set(
    "hourly",
    ["precipitation", "wind_gusts_10m"].join(","),
  );
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(","),
  );

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = (await res.json()) as OpenMeteoResponse;
  const c = data.current;
  if (!c) throw new Error("Open-Meteo: sem dados atuais");

  const code = c.weather_code ?? 0;
  const { condition, icon } = weatherCodeToLabel(code);
  const windDir =
    typeof c.wind_direction_10m === "number" ? degToCardinal(c.wind_direction_10m) : "—";

  const updatedAt = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const { precipMm, maxGustKmh } = sumNextHours(data.hourly, 3);

  return {
    temperature: Math.round(c.temperature_2m ?? 0),
    feelsLike: Math.round(c.apparent_temperature ?? c.temperature_2m ?? 0),
    humidity: Math.round(c.relative_humidity_2m ?? 0),
    windSpeed: Math.round(c.wind_speed_10m ?? 0),
    windDirection: windDir,
    rain: Number((c.precipitation ?? 0).toFixed(1)),
    condition,
    icon,
    updatedAt,
    precipitationNext3hMm: precipMm,
    maxWindGustNext3hKmh: maxGustKmh,
  };
}
