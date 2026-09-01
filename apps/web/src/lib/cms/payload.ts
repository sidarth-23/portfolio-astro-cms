import type { Payload } from "payload";

/** Load the CMS configuration for server-side queries. */
export async function getCmsPayload(): Promise<Payload> {
  const [{ default: config }, { getPayload }] = await Promise.all([
    import("@sidshub/cms/payload-config"),
    import("payload"),
  ]);

  return getPayload({ config });
}
