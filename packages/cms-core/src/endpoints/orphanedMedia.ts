import type { Endpoint } from "payload";

import {
  collectReferencedMediaIds,
  findOrphanedMedia,
} from "../lib/orphanedMedia";

const getHandler: Endpoint["handler"] = async (req) => {
  if (!req.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await findOrphanedMedia(req.payload);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
};

const deleteHandler: Endpoint["handler"] = async (req) => {
  if (!req.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let ids: string[] = [];
  try {
    const body = await req.json?.();
    if (Array.isArray(body?.ids)) {
      ids = body.ids.filter((id: unknown) => typeof id === "string");
    }
  } catch {
    // Body parse failure — treat as empty ids list
  }

  if (ids.length === 0) {
    return Response.json({ error: "No ids provided" }, { status: 400 });
  }

  // Re-verify which IDs are still orphaned before deleting
  let referencedIds: Set<string>;
  try {
    referencedIds = await collectReferencedMediaIds(req.payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }

  let deleted = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const id of ids) {
    // Skip if the media is now referenced — do not delete
    if (referencedIds.has(id)) {
      failed++;
      errors.push({ id, error: "Media is referenced and cannot be deleted" });
      continue;
    }

    try {
      await req.payload.delete({ collection: "media", id });
      deleted++;
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ id, error: message });
    }
  }

  return Response.json({ deleted, failed, errors });
};

export const orphanedMediaEndpoints: Endpoint[] = [
  { path: "/orphaned-media", method: "get", handler: getHandler },
  { path: "/orphaned-media", method: "delete", handler: deleteHandler },
];
