import type { CollectionAfterChangeHook } from "payload";

type TriggerFn = (
  logger: { info: (value: Record<string, unknown>) => void; error: (value: Record<string, unknown>) => void },
  meta: Record<string, string | number | undefined>,
) => Promise<void>;

const SHOULD_TRIGGER = new Set(["posts", "projects"]);

export function createCollectionRedeployHook(triggerDeploy: TriggerFn, triggerRefresh: TriggerFn): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, collection, req }) => {
    if (!SHOULD_TRIGGER.has(collection.slug)) {
      return doc;
    }

    const currentStatus = doc?._status as string | undefined;
    const previousStatus = previousDoc?._status as string | undefined;
    const wasPublished = previousStatus === "published";
    const isPublished = currentStatus === "published";

    if (!isPublished && !wasPublished) {
      return doc;
    }

    const meta = {
      collection: collection.slug,
      id: doc?.id,
      _status: currentStatus,
    };

    await triggerDeploy(req.payload.logger, meta);
    await triggerRefresh(req.payload.logger, meta);

    return doc;
  };
}
