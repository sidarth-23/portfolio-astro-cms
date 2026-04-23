import type { Config, Endpoint, Plugin } from "payload";

import { createConvertMarkdownEndpoint } from "./endpoints/convertMarkdown";
import { createImportMediaFromUrlEndpoint } from "./endpoints/importMediaFromUrl";
import type { MarkdownPastePluginOptions } from "./options";

export const markdownPastePlugin = (options?: MarkdownPastePluginOptions): Plugin => {
  return (incomingConfig: Config): Config => {
    const endpoints: Endpoint[] = [
      createImportMediaFromUrlEndpoint(options),
      createConvertMarkdownEndpoint(),
    ];

    return {
      ...incomingConfig,
      endpoints: [...(incomingConfig.endpoints ?? []), ...endpoints],
    };
  };
};
