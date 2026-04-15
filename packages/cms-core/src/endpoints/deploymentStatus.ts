import type { Endpoint } from "payload";

import { getDeploymentStatusAdapter, getDeploymentHookValid } from "@/builder";

export const deploymentStatusEndpoint: Endpoint = {
  path: "/deployment-status",
  method: "get",
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adapter = getDeploymentStatusAdapter();
    if (!adapter) {
      return Response.json({
        configured: false,
        misconfigured: !getDeploymentHookValid(),
        status: "unknown",
        lastDeployedAt: null,
        deployUrl: null,
      });
    }

    try {
      const result = await adapter.getStatus();
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
