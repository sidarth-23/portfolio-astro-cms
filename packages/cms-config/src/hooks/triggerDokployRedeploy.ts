import type { CollectionAfterChangeHook } from "payload";

const SHOULD_TRIGGER = new Set(["posts", "projects"]);

export const triggerDokployRedeploy: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  collection,
  req,
}) => {
  const hookUrl = process.env.SITE_BUILD_HOOK_URL;
  const hookSecret = process.env.SITE_BUILD_HOOK_SECRET;

  if (!hookUrl || !hookSecret) {
    return doc;
  }

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

  try {
    await fetch(hookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hookSecret}`,
      },
      body: JSON.stringify({
        collection: collection.slug,
        id: doc?.id,
        _status: currentStatus,
      }),
    });
  } catch (error) {
    req.payload.logger.error({
      message: "Failed to trigger Dokploy deploy hook",
      error,
      collection: collection.slug,
      id: doc?.id,
    });
  }

  return doc;
};
