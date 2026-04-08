/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CICLOVIAS_LIVE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
