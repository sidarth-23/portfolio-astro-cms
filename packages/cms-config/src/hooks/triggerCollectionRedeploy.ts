import type { CollectionAfterChangeHook } from "payload";

import { triggerDeployment } from "./triggerDeployment";

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

  await triggerDeployment(req.payload.logger, {
    collection: collection.slug,
    id: doc?.id,
    _status: currentStatus,
  });

  return doc;
};
