import type { Endpoint } from "payload";

import type { OgGenerationMode } from "../lib/og";
import { generateOgImages } from "../lib/og";

export const generateOgImagesEndpoint = (siteUrl?: string): Endpoint => {
  return {
    path: "/og-generate",
    method: "post",
    handler: async (req) => {
      if (!req.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      let mode: OgGenerationMode = "unset-only";
      try {
        const body = await req.json?.();
        if (body?.mode === "replace-all") mode = "replace-all";
      } catch {
        // Body parse failure — use default mode
      }

      try {
        const result = await generateOgImages(req.payload, mode, { siteUrl });
        return Response.json(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Response.json({ error: message }, { status: 500 });
      }
    },
  };
};
