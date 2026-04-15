import type { Endpoint } from "payload";
import { OgGenerationMode, generateOgImages } from "@/lib/og";

export const generateOgImagesEndpoint = (siteUrl?: string): Endpoint => {
  return {
    path: "/og-generate",
    method: "post",
    handler: async (req) => {
      if (!req.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      let mode: OgGenerationMode = "unset-only";
      let wipeOldImages = false;
      try {
        const body = await req.json?.();
        if (body?.mode === "replace-all") mode = "replace-all";
        if (body?.wipeOldImages === true) wipeOldImages = true;
      } catch {
        // Body parse failure — use default mode
      }

      try {
        const result = await generateOgImages(req.payload, mode, { siteUrl, wipeOldImages });
        return Response.json(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Response.json({ error: message }, { status: 500 });
      }
    },
  };
};
