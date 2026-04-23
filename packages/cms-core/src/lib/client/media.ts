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
