/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Ustaw na "false", aby wyłączyć wyszukiwanie w zewnętrznym serwisie Openverse. */
  readonly VITE_ENABLE_OPENVERSE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
