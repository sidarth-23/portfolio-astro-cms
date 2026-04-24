import type { AllowList } from "payload";

import { mediaPasteUrlAllowList } from "./endpoints/mediaPasteUrlAllowList";

export type AllowedImageHostsMode = "extend" | "override";

export type MarkdownPastePluginOptions = {
  allowedImageHosts?: AllowList;
  allowedImageHostsMode?: AllowedImageHostsMode;
  mediaCollectionSlug?: string;
};

export const DEFAULT_MEDIA_COLLECTION_SLUG = "media";

export const resolveMediaCollectionSlug = (options?: MarkdownPastePluginOptions): string => {
  const value = options?.mediaCollectionSlug?.trim();
  return value && value.length > 0 ? value : DEFAULT_MEDIA_COLLECTION_SLUG;
};

export const resolveAllowedImageHosts = (options?: MarkdownPastePluginOptions): AllowList => {
  const hosts = options?.allowedImageHosts ?? [];

  if (options?.allowedImageHostsMode === "override") {
    return [...hosts];
  }

  return [...mediaPasteUrlAllowList, ...hosts];
};
