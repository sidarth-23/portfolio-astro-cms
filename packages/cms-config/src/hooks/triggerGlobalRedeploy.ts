import type { GlobalAfterChangeHook } from "payload";

import { triggerDeployment } from "./triggerDeployment";

const SHOULD_TRIGGER = new Set(["home-page", "projects-page", "site-settings", "cv-page", "blog-page"]);

export const triggerGlobalRedeploy: GlobalAfterChangeHook = async ({ doc, global, req }) => {
  if (!SHOULD_TRIGGER.has(global.slug)) {
    return doc;
  }

  await triggerDeployment(req.payload.logger, {
    global: global.slug,
  });

  return doc;
};
