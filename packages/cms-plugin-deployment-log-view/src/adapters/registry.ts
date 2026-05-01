import { dokployAdapterDefinition } from "./dokploy";
import type { DeploymentAdapterRegistry } from "../types";

export const DEPLOYMENT_STATUS_ENDPOINT_PATH = "/deployment-log-view/v1/status";

export const defaultDeploymentAdapterRegistry = {
  dokploy: dokployAdapterDefinition,
} as const satisfies DeploymentAdapterRegistry;

export type DefaultDeploymentAdapterRegistry = typeof defaultDeploymentAdapterRegistry;
