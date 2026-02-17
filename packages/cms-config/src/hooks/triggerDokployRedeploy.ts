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

  if (!hookUrl) {
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
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (hookSecret) {
      headers.Authorization = `Bearer ${hookSecret}`;
    }

    const response = await fetch(hookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        collection: collection.slug,
        id: doc?.id,
        _status: currentStatus,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      req.payload.logger.error({
        message: "Dokploy deploy hook returned non-OK response",
        status: response.status,
        statusText: response.statusText,
        bodySnippet: body.replace(/\s+/g, " ").trim().slice(0, 240),
        collection: collection.slug,
        id: doc?.id,
      });
      return doc;
    }

    req.payload.logger.info({
      message: "Triggered Dokploy deploy hook",
      collection: collection.slug,
      id: doc?.id,
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
