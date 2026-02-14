import type { CollectionAfterChangeHook } from "payload";

const SHOULD_TRIGGER = new Set(["posts", "projects"]);

export const triggerDokployRedeploy: CollectionAfterChangeHook = async ({
  doc,
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

  const status = doc?.status as string | undefined;
  if (status && !["published", "scheduled"].includes(status)) {
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
        status,
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
