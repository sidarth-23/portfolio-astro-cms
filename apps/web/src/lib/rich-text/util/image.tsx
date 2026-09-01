/** @jsxImportSource preact */

export type ImageSize = {
  url?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  filesize?: number | null;
  filename?: string | null;
};

export type UploadDoc = {
  url?: string | null;
  alt?: string | null;
  mimeType?: string | null;
  filename?: string | null;
  width?: number | null;
  height?: number | null;
  sizes?: Record<string, ImageSize | null> | null;
};

export function resolveUrl(url: string, mediaBaseUrl?: string): string {
  if (!mediaBaseUrl || url.startsWith("http")) return url;
  return `${mediaBaseUrl}${url}`;
}

export type UsableImageSize = {
  url: string;
  width: number;
  height: number;
  mimeType: string;
  filesize: number;
  filename: string;
};

export function isUsableSize(s: ImageSize | null): s is UsableImageSize {
  return !!(s?.url && s.width && s.height && s.mimeType && s.filesize && s.filename);
}

export const IMG_STYLE = "width:100%;height:auto;display:block;";

export function ImagePicture({
  doc,
  alt,
  mediaBaseUrl,
}: {
  doc: UploadDoc;
  alt: string;
  mediaBaseUrl?: string;
}) {
  const url = resolveUrl(doc.url!, mediaBaseUrl);
  // Exclude hero sizes (16:9 cropped) — they are inappropriate for inline content images
  const usableSizes = Object.entries(doc.sizes ?? {})
    .filter((e): e is [string, UsableImageSize] => !e[0].startsWith("hero") && isUsableSize(e[1]))
    .map(([, s]) => s);

  if (usableSizes.length === 0) {
    return <img alt={alt} src={url} style={IMG_STYLE} />;
  }

  const sorted = [...usableSizes].sort((a, b) => a.width - b.width);
  const srcset = sorted.map((s) => `${resolveUrl(s.url, mediaBaseUrl)} ${s.width}w`).join(", ");

  return (
    <img
      alt={alt}
      src={url}
      srcset={srcset}
      sizes="(max-width: 768px) 100vw, 1200px"
      style={IMG_STYLE}
    />
  );
}
