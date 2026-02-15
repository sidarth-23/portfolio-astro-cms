/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly ASTRO_CMS_API_URL: string;
  readonly ASTRO_CMS_READ_TOKEN?: string;
  readonly ASTRO_CMS_HEALTH_TIMEOUT_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
