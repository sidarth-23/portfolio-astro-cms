import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

import type { CollectionConfig } from "payload";

import { fetchRemoteImage } from "../lib/remoteImageImport";

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    mimeTypes: ["image/*"],
  },
  access: {
    read: () => true,
  },
  endpoints: [
    {
      path: "/import-url",
      method: "post",
      handler: async (req) => {
        if (!req.user) {
          return Response.json({ message: "Unauthorized" }, { status: 401 });
        }

        if (!req.payload) {
          return Response.json({ message: "Payload request context is missing." }, { status: 500 });
        }

        let body: unknown;

        try {
          body = await req.json?.();
        } catch {
          return Response.json({ message: "Invalid request body." }, { status: 400 });
        }

        if (!body || typeof body !== "object") {
          return Response.json({ message: "Invalid request body." }, { status: 400 });
        }

        const { url, alt } = (body || {}) as { alt?: unknown; url?: unknown };

        if (typeof url !== "string" || !url.trim().length) {
          return Response.json({ message: "A valid image URL is required." }, { status: 400 });
        }

        if (typeof alt !== "string" || !alt.trim().length) {
          return Response.json({ message: "Alt text is required." }, { status: 400 });
        }

        try {
          const { data, finalUrl, filename } = await fetchRemoteImage(url.trim());
          const tempPath = `${tmpdir()}/${Date.now()}-${Math.random().toString(36).slice(2)}-${filename}`;

          await writeFile(tempPath, data);

          const doc = await (async () => {
            try {
              return await req.payload.create({
                collection: "media",
                data: {
                  alt: alt.trim(),
                  sourceUrl: finalUrl.toString(),
                },
                draft: false,
                filePath: tempPath,
                req,
              });
            } finally {
              await unlink(tempPath).catch(() => undefined);
            }
          })();

          return Response.json({ doc }, { status: 201 });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to import remote image.";
          req.payload.logger?.error({
            err: error,
            msg: "Remote image import failed",
          });

          return Response.json({ message }, { status: 400 });
        }
      },
    },
  ],
  admin: {
    useAsTitle: "alt",
    group: "Assets",
    components: {
      edit: {
        Upload: "./components/admin/RemoteImageUpload#RemoteImageUploadServer",
      },
    },
  },
  fields: [

    {
      name: "alt",
      type: "text",
      required: true,
      label: "Alt Text",
    },
    {
      name: "caption",
      type: "richText",
    },
    {
      name: "sourceUrl",
      type: "text",
      required: false,
      admin: {
        readOnly: true,
        description: "Original remote URL used to import this image.",
      },
    },
  ],
};
