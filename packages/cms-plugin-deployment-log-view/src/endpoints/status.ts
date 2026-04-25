import type { Endpoint } from "payload";

import type {
  DeploymentAdapterRegistry,
  DeploymentLogViewPluginOptions,
  DeploymentStatusAdapter,
} from "../types";

type ResolvedStatusSource = {
  adapter?: DeploymentStatusAdapter;
  configured: boolean;
  misconfigured: boolean;
  providerLabel: string | null;
  connectionOk: boolean | null;
  message: string | null;
};

const UNKNOWN_STATUS_RESPONSE = {
  status: "unknown",
  lastDeployedAt: null,
  deployUrl: null,
} as const;

async function resolveStatusSource<TRegistry extends DeploymentAdapterRegistry>(
  options: DeploymentLogViewPluginOptions<TRegistry>,
  registry: TRegistry,
): Promise<ResolvedStatusSource> {
  if (options.enabled === false) {
    return {
      configured: false,
      misconfigured: false,
      providerLabel: null,
      connectionOk: null,
      message: "Deployment log view plugin is disabled.",
    };
  }

  if ("adapter" in options) {
    return {
      adapter: options.adapter,
      configured: true,
      misconfigured: false,
      providerLabel: "Custom",
      connectionOk: null,
      message: null,
    };
  }

  const definition = registry[options.provider];
  if (!definition) {
    return {
      configured: false,
      misconfigured: true,
      providerLabel: String(options.provider),
      connectionOk: false,
      message: `Unknown deployment adapter provider: ${String(options.provider)}.`,
    };
  }

  const isValid = definition.isConfigValid ? definition.isConfigValid(options.config) : true;
  if (!isValid) {
    return {
      configured: false,
      misconfigured: true,
      providerLabel: definition.label,
      connectionOk: false,
      message: `Missing or invalid ${definition.label} adapter configuration values.`,
    };
  }

  if (definition.checkConnection) {
    try {
      const connection = await definition.checkConnection(options.config);
      if (!connection.ok) {
        return {
          configured: false,
          misconfigured: true,
          providerLabel: definition.label,
          connectionOk: false,
          message: connection.message ?? `${definition.label} connection check failed.`,
        };
      }
    } catch {
      return {
        configured: false,
        misconfigured: true,
        providerLabel: definition.label,
        connectionOk: false,
        message: `${definition.label} connection check failed.`,
      };
    }
  }

  try {
    return {
      adapter: definition.createAdapter(options.config),
      configured: true,
      misconfigured: false,
      providerLabel: definition.label,
      connectionOk: definition.checkConnection ? true : null,
      message: null,
    };
  } catch {
    return {
      configured: false,
      misconfigured: true,
      providerLabel: definition.label,
      connectionOk: false,
      message: `${definition.label} adapter initialization failed.`,
    };
  }
}

export function createDeploymentStatusEndpoint<TRegistry extends DeploymentAdapterRegistry>(args: {
  endpointPath: string;
  options: DeploymentLogViewPluginOptions<TRegistry>;
  registry: TRegistry;
}): Endpoint {
  return {
    path: args.endpointPath,
    method: "get",
    handler: async (req) => {
      if (!req.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const statusSource = await resolveStatusSource(args.options, args.registry);

      if (!statusSource.adapter) {
        return Response.json({
          configured: statusSource.configured,
          misconfigured: statusSource.misconfigured,
          providerLabel: statusSource.providerLabel,
          connectionOk: statusSource.connectionOk,
          message: statusSource.message,
          ...UNKNOWN_STATUS_RESPONSE,
        });
      }

      try {
        const result = await statusSource.adapter.getStatus();
        return Response.json({
          configured: true,
          misconfigured: false,
          providerLabel: statusSource.providerLabel,
          connectionOk: statusSource.connectionOk,
          message: null,
          ...result,
        });
      } catch {
        return Response.json({
          configured: true,
          misconfigured: false,
          providerLabel: statusSource.providerLabel,
          connectionOk: statusSource.connectionOk,
          message: "Failed to fetch deployment status.",
          ...UNKNOWN_STATUS_RESPONSE,
        });
      }
    },
  };
}
