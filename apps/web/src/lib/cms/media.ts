import type { Media } from "@sidshub/cms/payload-types";
import { isRelationID } from "./relations";

export const createMediaUrlResolver = (mediaBaseUrl: string) => {
  return (media: Media | string | number | null | undefined): string | undefined => {
    if (!media) return undefined;
    if (typeof media === "string") {
      if (media.startsWith("http") || media.startsWith("/")) return media;
      return undefined;
    }
    if (isRelationID(media)) return undefined;
    if (!media.url) return undefined;
    return media.url.startsWith("http") ? media.url : `${mediaBaseUrl}${media.url}`;
  };
};

export const createMediaSizeUrlResolver = (mediaBaseUrl: string) => {
  return (
    media: Media | string | number | null | undefined,
    sizeName: string,
  ): string | undefined => {
    if (!media || typeof media !== "object") return undefined;
    const size = media.sizes?.[sizeName as keyof NonNullable<Media["sizes"]>];
    if (!size?.url) return undefined;
    return size.url.startsWith("http") ? size.url : `${mediaBaseUrl}${size.url}`;
  };
};
