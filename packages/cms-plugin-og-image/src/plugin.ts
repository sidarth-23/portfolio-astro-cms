import type { Config, Plugin } from "payload";

import { createGenerateOgImagesEndpoint } from "./generateOgImages";

export const ogImagePlugin = (siteUrl?: string): Plugin => {
  return (incomingConfig: Config): Config => ({
    ...incomingConfig,
    endpoints: [...(incomingConfig.endpoints ?? []), createGenerateOgImagesEndpoint(siteUrl)],
  });
};
