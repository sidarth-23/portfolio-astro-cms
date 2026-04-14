import { dokployAdapter } from "./dokployAdapter";
import type { DeploymentStatusAdapter } from "./types";

export type HookType = "dokploy";

export type HookConfig = {
  type: "dokploy";
  apiUrl: string;
  apiKey: string;
  applicationId: string;
  projectId?: string;
};

export function createDeploymentAdapter(config: HookConfig): DeploymentStatusAdapter {
  switch (config.type) {
    case "dokploy":
      return dokployAdapter({
        apiUrl: config.apiUrl,
        apiKey: config.apiKey,
        applicationId: config.applicationId,
        projectId: config.projectId,
      });
  }
}
