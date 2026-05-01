import type { Media } from "@/payload-types";

const isRelationID = (value: unknown): value is number | string => {
  return typeof value === "number" || typeof value === "string";
};

export const createMediaUrlResolver = (
  mediaBaseUrl: string,
): ((media: Media | string | number | null | undefined) => string | undefined) => {
  return (media) => {
    if (!media) {
      return undefined;
    }

    if (typeof media === "string") {
      if (media.startsWith("http") || media.startsWith("/")) {
        return media;
      }
      return undefined;
    }

    if (isRelationID(media)) {
      return undefined;
    }

    if (!media.url) {
      return undefined;
    }

    return media.url.startsWith("http") ? media.url : `${mediaBaseUrl}${media.url}`;
  };
};

export const createMediaSizeUrlResolver = (
  mediaBaseUrl: string,
): ((
  media: Media | string | number | null | undefined,
  sizeName: string,
) => string | undefined) => {
  return (media, sizeName) => {
    if (!media || typeof media !== "object") return undefined;
    const sizeField = (media as Media).sizes;
    if (!sizeField) return undefined;
    const size = sizeField[sizeName as keyof typeof sizeField];
    if (!size || !size.url) return undefined;
    return size.url.startsWith("http") ? size.url : `${mediaBaseUrl}${size.url}`;
  };
};
