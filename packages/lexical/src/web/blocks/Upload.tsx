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
  captionHtml?: string | null;
  mediaBaseUrl?: string;
};

// Shared inline style for the absolutely-positioned image — fills the
// 16:9 container while preserving the full image via object-contain.
const IMG_STYLE = "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block;";

function ImagePicture({ doc, alt, mediaBaseUrl }: { doc: UploadDoc; alt: string; mediaBaseUrl?: string }) {
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

export function Upload({ doc, alt, captionHtml, mediaBaseUrl }: Props) {
  if (!doc.url) return null;

  const url = resolveUrl(doc.url, mediaBaseUrl);
  const captionText = (captionHtml ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  const hasCaption = captionText.length > 0;

  if (!doc.mimeType?.startsWith("image")) {
    return (
      <a href={url} rel="noopener noreferrer">
        {doc.filename ?? url}
      </a>
    );
  }

  return (
    <figure class="image-figure">
      {/* position:relative + aspect-ratio creates the 16:9 letterbox frame */}
      <div style="position:relative;width:100%;aspect-ratio:16/9;background-color:var(--fallback-b2,oklch(var(--b2)));overflow:hidden;border-radius:0.5rem;">
        <ImagePicture doc={doc} alt={alt} mediaBaseUrl={mediaBaseUrl} />
      </div>
      <figcaption
        class={hasCaption ? "has-caption" : "no-caption"}
        dangerouslySetInnerHTML={hasCaption ? { __html: captionHtml! } : undefined}
      />
    </figure>
  );
}
