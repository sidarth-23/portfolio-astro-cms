const useMock =
  String(import.meta.env.ASTRO_MOCK_CMS ?? process.env.ASTRO_MOCK_CMS ?? "") === "true";
const siteUrl = typeof import.meta.env.SITE === "string" ? import.meta.env.SITE : undefined;

const createClient = async () => {
  if (useMock) {
    const { createCmsMockClient } = await import("@sidshub/cms-core/client/mock");
    return createCmsMockClient();
  }
  const { ASTRO_CMS_API_URL, ASTRO_CMS_READ_TOKEN } = await import("astro:env/server");
  const { createCmsRestClient } = await import("@sidshub/cms-core/client/rest");
  return createCmsRestClient({ apiUrl: ASTRO_CMS_API_URL, token: ASTRO_CMS_READ_TOKEN, siteUrl });
};

export const cmsClient = await createClient();
