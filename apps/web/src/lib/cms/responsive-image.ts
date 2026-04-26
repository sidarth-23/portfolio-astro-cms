import type { Media } from "@sidshub/cms-core/payload-types";

type MediaSizeUrlFn = (
  media: Media | string | number | null | undefined,
  sizeName: string,
) => string | undefined;

export type HeroImageSources = {
  src: string;
  srcset: string;
  sizes: string;
  width: number;
  height: number;
};

export function getHeroImageSources(
  media: Media | string | number | null | undefined,
  mediaSizeUrl: MediaSizeUrlFn,
): HeroImageSources | undefined {
  if (!media || typeof media !== "object") return undefined;

  const lgUrl = mediaSizeUrl(media, "heroLg");
  const mdUrl = mediaSizeUrl(media, "heroMd");
  const smUrl = mediaSizeUrl(media, "heroSm");

  if (!lgUrl) return undefined;

  const srcsetParts: string[] = [];
  if (smUrl) srcsetParts.push(`${smUrl} 480w`);
  if (mdUrl) srcsetParts.push(`${mdUrl} 768w`);
  srcsetParts.push(`${lgUrl} 1280w`);

  return {
    src: lgUrl,
    srcset: srcsetParts.join(", "),
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px",
    width: 1280,
    height: 720,
  };
}
