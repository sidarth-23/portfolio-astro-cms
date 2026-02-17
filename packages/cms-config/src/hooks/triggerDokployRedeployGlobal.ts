import type { GlobalAfterChangeHook } from "payload";

import { triggerDokployDeploy } from "./triggerDokployDeploy";

const SHOULD_TRIGGER = new Set(["home-page", "projects-page", "site-settings", "cv-page"]);

export const triggerDokployRedeployGlobal: GlobalAfterChangeHook = async ({ doc, global, req }) => {
  if (!SHOULD_TRIGGER.has(global.slug)) {
    return doc;
  }

  await triggerDokployDeploy(req.payload.logger, {
    global: global.slug,
  });

  return doc;
};
