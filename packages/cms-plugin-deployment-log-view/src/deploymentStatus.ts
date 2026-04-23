import type { Endpoint } from "payload";

import type { DeploymentStatusAdapter } from "./deployment/types";

export const createDeploymentStatusEndpoint = (args: {
  adapter?: DeploymentStatusAdapter;
  hookValid: boolean;
}): Endpoint => {
  return {
    path: "/deployment-log-view/status",
    method: "get",
    handler: async (req) => {
      if (!req.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (!args.adapter) {
        return Response.json({
          configured: false,
          misconfigured: !args.hookValid,
          status: "unknown",
          lastDeployedAt: null,
          deployUrl: null,
        });
      }

      try {
        const result = await args.adapter.getStatus();
        return Response.json({ configured: true, misconfigured: false, ...result });
      } catch {
        return Response.json({
          configured: true,
          misconfigured: false,
          status: "unknown",
          lastDeployedAt: null,
          deployUrl: null,
        });
      }
    },
  };
};
