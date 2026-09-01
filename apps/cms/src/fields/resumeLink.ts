import type { Field } from "payload";

import { RESUME_URL_TYPE_OPTIONS } from "@cms/lib/content";

const DRIVE_FILE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/uc\?[^#]*[?&]id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/uc\?export=download&id=([a-zA-Z0-9_-]+)/,
];

const DOCS_FILE_ID_PATTERN = /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/;

const extractDriveFileId = (url: string): string | null => {
  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
};

const extractDocsFileId = (url: string): string | null => {
  const match = url.match(DOCS_FILE_ID_PATTERN);
  return match?.[1] ?? null;
};

const resolveResumeUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return "";
  }

  const docsId = extractDocsFileId(trimmed);
  if (docsId) {
    return `https://docs.google.com/document/d/${docsId}/export?format=pdf`;
  }

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return trimmed;
};

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
