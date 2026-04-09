/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_CICLOVIAS_LIVE_URL?: string;
  readonly VITE_OSRM_URL?: string;
  /** Opcional: endpoint Open-Elevation (POST /lookup). Padrão: api.open-elevation.com. */
  readonly VITE_ELEVATION_URL?: string;
  readonly VITE_OVERPASS_URL?: string;
  /** Opcional: URL base do Nominatim (geocodificação reversa). Padrão: proxy `/nominatim`. */
  readonly VITE_NOMINATIM_URL?: string;
  /**
   * Opcional: endpoint para histórico de movimento por trecho (gráfico no detalhe).
   * Query `id` = id do trecho, ou use `{id}` no path. Resposta: `TrafficHistory[]` ou `{ history: [...] }`.
   */
  readonly VITE_TRAFFIC_HISTORY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
