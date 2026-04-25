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

export function isUsableSize(s: ImageSize | null): s is Required<ImageSize> {
  return !!(s?.url && s.width && s.height && s.mimeType && s.filesize && s.filename);
}

// Shared inline style for the absolutely-positioned image — fills the
// container while preserving the full image via object-contain.
export const IMG_STYLE =
  "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block;";

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
  const usableSizes = Object.values(doc.sizes ?? {}).filter(isUsableSize);

  if (usableSizes.length === 0) {
    return <img alt={alt} src={url} style={IMG_STYLE} />;
  }

  return (
    <picture>
      {usableSizes.map((s) => (
        <source
          key={s.url}
          media={`(max-width: ${s.width}px)`}
          srcset={resolveUrl(s.url!, mediaBaseUrl)}
          type={s.mimeType ?? undefined}
        />
      ))}
      <img alt={alt} src={url} style={IMG_STYLE} />
    </picture>
  );
}
