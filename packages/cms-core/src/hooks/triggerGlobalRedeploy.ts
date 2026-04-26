import type { GlobalAfterChangeHook } from "payload";

type TriggerFn = (
  logger: {
    info: (value: Record<string, unknown>) => void;
    error: (value: Record<string, unknown>) => void;
  },
  meta: Record<string, string | number | undefined>,
) => Promise<void>;

/**
 * Globals that should NOT trigger a redeploy on change.
 *
 * Currently empty — all globals are page configs that affect the frontend.
 * Add slugs here only for globals that are purely internal / admin-only.
 */
const SKIP_GLOBALS = new Set<string>([]);

export function createGlobalRedeployHook(
  triggerDeploy: TriggerFn,
  triggerRefresh: TriggerFn,
): GlobalAfterChangeHook {
  return async ({ doc, global, req }) => {
    if (SKIP_GLOBALS.has(global.slug)) {
      return doc;
    }

    const meta = { global: global.slug };

    await triggerDeploy(req.payload.logger, meta);
    await triggerRefresh(req.payload.logger, meta);

    return doc;
  };
}
