/** @jsxImportSource preact */

type ImageSize = {
  url?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  filesize?: number | null;
  filename?: string | null;
};

type UploadDoc = {
  url?: string | null;
  alt?: string | null;
  mimeType?: string | null;
  filename?: string | null;
  width?: number | null;
  height?: number | null;
  sizes?: Record<string, ImageSize | null> | null;
};

function resolveUrl(url: string, mediaBaseUrl?: string): string {
  if (!mediaBaseUrl || url.startsWith("http")) return url;
  return `${mediaBaseUrl}${url}`;
}

function isUsableSize(s: ImageSize | null): s is Required<ImageSize> {
  return !!(s?.url && s.width && s.height && s.mimeType && s.filesize && s.filename);
}

type Props = {
  doc: UploadDoc;
  alt: string;
  mediaBaseUrl?: string;
};

export function Upload({ doc, alt, mediaBaseUrl }: Props) {
  if (!doc.url) return null;

  const url = resolveUrl(doc.url, mediaBaseUrl);

  if (!doc.mimeType?.startsWith("image")) {
    return (
      <a href={url} rel="noopener noreferrer">
        {doc.filename ?? url}
      </a>
    );
  }

  const usableSizes = Object.values(doc.sizes ?? {}).filter(isUsableSize);

  if (usableSizes.length === 0) {
    return <img alt={alt} height={doc.height ?? undefined} src={url} width={doc.width ?? undefined} />;
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
      <img alt={alt} height={doc.height ?? undefined} src={url} width={doc.width ?? undefined} />
    </picture>
  );
}
