import type { Endpoint } from "payload";

import { getDeploymentStatusAdapter } from "../builder";

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
        status: "unknown",
        lastDeployedAt: null,
        deployUrl: null,
      });
    }

    try {
      const result = await adapter.getStatus();
      return Response.json(result);
    } catch {
      return Response.json({
        status: "unknown",
        lastDeployedAt: null,
        deployUrl: null,
      });
    }
  },
};
