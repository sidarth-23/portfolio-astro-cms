import type { Field } from "payload";

import { RESUME_URL_TYPE_OPTIONS, resolveResumeUrl } from "@/lib/content";

export const resumeLinkFields: Field[] = [
  {
    name: "resumeUrlType",
    type: "select",
    required: false,
    options: RESUME_URL_TYPE_OPTIONS,
    admin: {
      description:
        "Select Google Drive to auto-convert a sharing URL into a download link. Select Custom Link for any direct download URL.",
    },
  },
  {
    name: "resumeUrl",
    type: "text",
    required: false,
    admin: {
      description: "Paste the full URL — a Google Drive sharing link or a direct download link.",
    },
  },
  {
    name: "resumeDownloadUrl",
    type: "text",
    required: false,
    admin: {
      readOnly: true,
      description:
        "Auto-generated downloadable link. For Google Drive: converted from the sharing URL above. For Custom: used as-is.",
    },
    hooks: {
      beforeValidate: [
        ({ data }) => {
          const rawUrl = data?.resumeUrl;
          if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
            return "";
          }

          if (data?.resumeUrlType === "google") {
            return resolveResumeUrl(rawUrl);
          }

          return rawUrl.trim();
        },
      ],
    },
  },
];
