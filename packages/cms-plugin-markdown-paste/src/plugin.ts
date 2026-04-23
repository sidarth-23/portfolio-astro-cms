import type { Config, Endpoint, Plugin } from "payload";

import { convertMarkdownEndpoint } from "./endpoints/convertMarkdown";
import { importMediaFromUrlEndpoint } from "./endpoints/importMediaFromUrl";

export const markdownPastePlugin = (): Plugin => {
  return (incomingConfig: Config): Config => {
    const endpoints: Endpoint[] = [importMediaFromUrlEndpoint, convertMarkdownEndpoint];

    return {
      ...incomingConfig,
      endpoints: [...(incomingConfig.endpoints ?? []), ...endpoints],
    };
  };
};
