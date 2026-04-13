import type { GlobalAfterChangeHook } from "payload";

type TriggerFn = (
  logger: { info: (value: Record<string, unknown>) => void; error: (value: Record<string, unknown>) => void },
  meta: Record<string, string | number | undefined>,
) => Promise<void>;

const SHOULD_TRIGGER = new Set(["home-page", "projects-page", "site-settings", "cv-page", "blog-page"]);

export function createGlobalRedeployHook(triggerDeploy: TriggerFn, triggerRefresh: TriggerFn): GlobalAfterChangeHook {
  return async ({ doc, global, req }) => {
    if (!SHOULD_TRIGGER.has(global.slug)) {
      return doc;
    }

    const meta = { global: global.slug };

    await triggerDeploy(req.payload.logger, meta);
    await triggerRefresh(req.payload.logger, meta);

    return doc;
  };
}
