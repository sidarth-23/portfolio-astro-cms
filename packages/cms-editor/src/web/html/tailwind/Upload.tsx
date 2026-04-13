/** @jsxImportSource preact */
import { resolveUrl, ImagePicture } from "../../util/image";
import type { UploadProps } from "../types";

export function Upload({ doc, alt, captionHtml, mediaBaseUrl }: UploadProps) {
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
      <div class="relative w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800" style="aspect-ratio:16/9;">
        <ImagePicture doc={doc} alt={alt} mediaBaseUrl={mediaBaseUrl} />
      </div>
      <figcaption
        class={hasCaption ? "has-caption" : "no-caption"}
        dangerouslySetInnerHTML={hasCaption ? { __html: captionHtml! } : undefined}
      />
    </figure>
  );
}
