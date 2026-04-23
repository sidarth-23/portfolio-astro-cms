import type { Config, Endpoint, Plugin } from "payload";

import { convertMarkdownEndpoint } from "./convertMarkdown";
import { importMediaFromUrlEndpoint } from "./importMediaFromUrl";

export const markdownPastePlugin = (): Plugin => {
  return (incomingConfig: Config): Config => {
    const endpoints: Endpoint[] = [importMediaFromUrlEndpoint, convertMarkdownEndpoint];

    return {
      ...incomingConfig,
      endpoints: [...(incomingConfig.endpoints ?? []), ...endpoints],
    };
  };
};
