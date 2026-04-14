import type { Payload } from "payload";

const OG_FOLDER_NAME = "Auto-Generated";

/**
 * Ensures the "Auto-Generated" folder exists in the payload-folders collection.
 * Creates it if it doesn't exist. Returns the folder document ID.
 */
export async function ensureOgFolder(payload: Payload): Promise<string> {
  const existing = await payload.find({
    collection: "payload-folders",
    where: { name: { equals: OG_FOLDER_NAME } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    return existing.docs[0].id;
  }

  const created = await payload.create({
    collection: "payload-folders",
    data: { name: OG_FOLDER_NAME },
  });

  return created.id;
}
