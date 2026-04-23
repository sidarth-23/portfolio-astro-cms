import type { Config, Plugin } from "payload";

import type { DeploymentStatusAdapter } from "./deployment/types";
import { createDeploymentStatusEndpoint } from "./deploymentStatus";

export const deploymentLogViewPlugin = (options: {
  adapter?: DeploymentStatusAdapter;
  hookValid?: boolean;
}): Plugin => {
  return (incomingConfig: Config): Config => ({
    ...incomingConfig,
    endpoints: [
      ...(incomingConfig.endpoints ?? []),
      createDeploymentStatusEndpoint({
        adapter: options.adapter,
        hookValid: options.hookValid ?? false,
      }),
    ],
  });
};
