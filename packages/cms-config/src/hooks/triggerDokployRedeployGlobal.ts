import type { GlobalAfterChangeHook } from "payload";

const SHOULD_TRIGGER = new Set(["home-page", "projects-page", "site-settings", "cv-page"]);

export const triggerDokployRedeployGlobal: GlobalAfterChangeHook = async ({ doc, global, req }) => {
  const hookUrl = process.env.SITE_BUILD_HOOK_URL;
  const hookSecret = process.env.SITE_BUILD_HOOK_SECRET;

  if (!hookUrl) {
    return doc;
  }

  if (!SHOULD_TRIGGER.has(global.slug)) {
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
        global: global.slug,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      req.payload.logger.error({
        message: "Dokploy deploy hook returned non-OK response for global change",
        status: response.status,
        statusText: response.statusText,
        bodySnippet: body.replace(/\s+/g, " ").trim().slice(0, 240),
        global: global.slug,
      });
      return doc;
    }

    req.payload.logger.info({
      message: "Triggered Dokploy deploy hook for global change",
      global: global.slug,
    });
  } catch (error) {
    req.payload.logger.error({
      message: "Failed to trigger Dokploy deploy hook for global change",
      error,
      global: global.slug,
    });
  }

  return doc;
};
