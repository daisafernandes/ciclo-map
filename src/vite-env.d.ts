/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_CICLOVIAS_LIVE_URL?: string;
  readonly VITE_OSRM_URL?: string;
  readonly VITE_OSRM_PROFILE?: string;
  readonly VITE_OVERPASS_URL?: string;
  /** Opcional: URL base do Nominatim (geocodificação reversa). Padrão: proxy `/nominatim`. */
  readonly VITE_NOMINATIM_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
