/** @jsxImportSource preact */
import { resolveUrl, ImagePicture, type UploadDoc } from "./image-utils";

type Props = {
  doc: UploadDoc;
  alt: string;
  captionHtml?: string | null;
  mediaBaseUrl?: string;
};

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
