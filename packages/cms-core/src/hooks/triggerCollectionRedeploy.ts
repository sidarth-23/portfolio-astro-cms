import type { CollectionAfterChangeHook } from "payload";

type TriggerFn = (
  logger: {
    info: (value: Record<string, unknown>) => void;
    error: (value: Record<string, unknown>) => void;
  },
  meta: Record<string, string | number | undefined>,
) => Promise<void>;

/**
 * Collections that should NOT trigger a redeploy on change.
 *
 * Media is excluded because uploads happen frequently during editing sessions
 * and the parent document save triggers the rebuild independently. All other
 * collections trigger by default — add slugs here only for collections that
 * are purely internal and have no frontend impact.
 */
const SKIP_COLLECTIONS = new Set(["media"]);

export function createCollectionRedeployHook(
  triggerDeploy: TriggerFn,
  triggerRefresh: TriggerFn,
): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, collection, req }) => {
    const slug = collection.slug;

    if (SKIP_COLLECTIONS.has(slug)) {
      return doc;
    }

    // Detect draft/publish workflow dynamically from the collection config.
    // This avoids hardcoding collection slugs and automatically handles any
    // future collection that enables versions/drafts.
    const hasDrafts = Boolean(collection.versions?.drafts);

    if (hasDrafts) {
      const currentStatus = doc?._status as string | undefined;
      const previousStatus = previousDoc?._status as string | undefined;

      if (currentStatus !== "published" && previousStatus !== "published") {
        return doc;
      }
    }

    const meta: Record<string, string | number | undefined> = {
      collection: slug,
      id: doc?.id,
      ...(hasDrafts ? { _status: doc?._status as string | undefined } : {}),
    };

    await triggerDeploy(req.payload.logger, meta);
    await triggerRefresh(req.payload.logger, meta);

    return doc;
  };
}
