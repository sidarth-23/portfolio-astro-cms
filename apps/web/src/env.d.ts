import "../.astro/types.d.ts";

interface ImportMetaEnv {
  readonly ASTRO_CMS_API_URL: string;
  readonly ASTRO_MOCK_CMS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
