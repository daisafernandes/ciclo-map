import type { WeatherData } from "@/data/ciclovias";

/** Curitiba — alinhado ao centro do mapa */
const LAT = -25.4284;
const LON = -49.2733;

interface OpenMeteoCurrent {
  temperature_2m?: number;
  relative_humidity_2m?: number;
  apparent_temperature?: number;
  precipitation?: number;
  weather_code?: number;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
}

interface OpenMeteoResponse {
  current?: OpenMeteoCurrent;
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

export async function fetchCuritibaWeather(): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(LAT));
  url.searchParams.set("longitude", String(LON));
  url.searchParams.set("timezone", "America/Sao_Paulo");
  url.searchParams.set("wind_speed_unit", "kmh");
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
  };
}
