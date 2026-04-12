import type { GlobalAfterChangeHook } from "payload";

import { triggerDeployment } from "./triggerDeployment";
import { triggerDevRefresh } from "./triggerDevRefresh";

const SHOULD_TRIGGER = new Set(["home-page", "projects-page", "site-settings", "cv-page", "blog-page"]);

export const triggerGlobalRedeploy: GlobalAfterChangeHook = async ({ doc, global, req }) => {
  if (!SHOULD_TRIGGER.has(global.slug)) {
    return doc;
  }

  const meta = { global: global.slug };

  await triggerDeployment(req.payload.logger, meta);
  await triggerDevRefresh(req.payload.logger, meta);

  return doc;
};
