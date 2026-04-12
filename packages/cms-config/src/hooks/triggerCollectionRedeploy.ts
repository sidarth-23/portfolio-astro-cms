import type { CollectionAfterChangeHook } from "payload";

import { triggerDeployment } from "./triggerDeployment";
import { triggerDevRefresh } from "./triggerDevRefresh";

const SHOULD_TRIGGER = new Set(["posts", "projects"]);

export const triggerCollectionRedeploy: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  collection,
  req,
}) => {
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

  await triggerDeployment(req.payload.logger, meta);
  await triggerDevRefresh(req.payload.logger, meta);

  return doc;
};
