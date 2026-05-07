function resolveEnvUrl(envValue: string | undefined, fallback: string): string {
  const v = envValue?.trim().replace(/\/$/, "");
  return v && v.length > 0 ? v : fallback;
}

export function nominatimBase(): string {
  return resolveEnvUrl(import.meta.env.VITE_NOMINATIM_URL, "/nominatim");
}

export function osrmBase(): string {
  return resolveEnvUrl(import.meta.env.VITE_OSRM_URL, "/osrm");
}

export function overpassBase(): string {
  const v = import.meta.env.VITE_OVERPASS_URL?.trim();
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return import.meta.env.DEV
    ? "/overpass-api/api/interpreter"
    : "https://overpass-api.de/api/interpreter";
}

export function elevationBase(): string {
  return resolveEnvUrl(
    import.meta.env.VITE_ELEVATION_URL,
    "https://api.open-elevation.com/api/v1/lookup",
  );
}
