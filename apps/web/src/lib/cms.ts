const useMock = import.meta.env.ASTRO_MOCK_CMS === "true";

const createClient = async () => {
  if (useMock) {
    const { createCmsMockClient } = await import("@sidshub/cms-core/client/mock");
    return createCmsMockClient();
  }
  const { ASTRO_CMS_API_URL, ASTRO_CMS_READ_TOKEN } = await import("astro:env/server");
  const { createCmsRestClient } = await import("@sidshub/cms-core/client/rest");
  return createCmsRestClient({ apiUrl: ASTRO_CMS_API_URL, token: ASTRO_CMS_READ_TOKEN });
};

export const cmsClient = await createClient();
