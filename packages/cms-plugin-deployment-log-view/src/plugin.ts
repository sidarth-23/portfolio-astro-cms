import type { Config, Plugin } from "payload";

import {
  DEPLOYMENT_STATUS_ENDPOINT_PATH,
  defaultDeploymentAdapterRegistry,
} from "./adapters/registry";
import { createDeploymentStatusEndpoint } from "./endpoints/status";
import type { DeploymentAdapterRegistry, DeploymentLogViewPluginOptions } from "./types";

function createDeploymentLogViewPlugin<TRegistry extends DeploymentAdapterRegistry>(
  options: DeploymentLogViewPluginOptions<TRegistry>,
  registry: TRegistry,
): Plugin {
  return (incomingConfig: Config): Config => ({
    ...incomingConfig,
    endpoints: [
      ...(incomingConfig.endpoints ?? []),
      createDeploymentStatusEndpoint({
        endpointPath: DEPLOYMENT_STATUS_ENDPOINT_PATH,
        options,
        registry,
      }),
    ],
  });
}

export function deploymentLogViewPlugin(
  options: DeploymentLogViewPluginOptions<typeof defaultDeploymentAdapterRegistry>,
): Plugin {
  return createDeploymentLogViewPlugin(options, defaultDeploymentAdapterRegistry);
}

export function deploymentLogViewPluginWithRegistry<TRegistry extends DeploymentAdapterRegistry>(
  options: DeploymentLogViewPluginOptions<TRegistry>,
  registry: TRegistry,
): Plugin {
  return createDeploymentLogViewPlugin(options, registry);
}
