import type { Payload } from "payload";

const OG_FOLDER_NAME = "Auto-Generated";

/**
 * Ensures the "Auto-Generated" folder exists in the payload-folders collection.
 * Creates it if it doesn't exist. Returns the folder document ID.
 *
 * NOTE: "payload-folders" is not yet in the generated payload-types.ts, so the
 * collection slug is cast to `never` to avoid TypeScript errors until types are
 * regenerated.
 */
export async function ensureOgFolder(payload: Payload): Promise<number | string> {
  const existing = await payload.find({
    collection: "payload-folders" as never,
    where: { name: { equals: OG_FOLDER_NAME } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    const doc = existing.docs[0] as unknown as { id: number | string };
    return doc.id;
  }

  const created = await payload.create({
    collection: "payload-folders" as never,
    data: { name: OG_FOLDER_NAME } as never,
  });

  const doc = created as unknown as { id: number | string };
  return doc.id;
}
