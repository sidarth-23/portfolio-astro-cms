/** @jsxImportSource preact */
import { ImagePicture } from "../image-utils";
import type { ImageGalleryProps } from "../types";

const CHEVRON_LEFT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M165.66 202.34a8 8 0 0 1-11.32 11.32l-80-80a8 8 0 0 1 0-11.32l80-80a8 8 0 0 1 11.32 11.32L91.31 128Z"/></svg>`;
const CHEVRON_RIGHT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M181.66 133.66l-80 80a8 8 0 0 1-11.32-11.32L164.69 128L90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32Z"/></svg>`;

export function ImageGalleryDaisy({ images, mediaBaseUrl }: ImageGalleryProps) {
  const total = images.length;
  const initialCaptionHtml = images[0]?.captionHtml?.trim() ?? "";
  const initialHasCaption = initialCaptionHtml.length > 0;

  return (
    <figure class="image-gallery-figure my-8" style={`--gallery-count:${total};`}>
      <div
        class="relative overflow-hidden rounded-xl"
        role="region"
        aria-roledescription="carousel"
        aria-label="Image gallery"
        data-image-gallery
      >
        {/* Embla viewport */}
        <div class="overflow-hidden" data-gallery-viewport>
          <div class="flex" data-gallery-slides>
            {images.map((img, i) => (
              <div
                key={i}
                class="image-gallery-slide min-w-0 flex-[0_0_100%]"
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${i + 1} of ${total}`}
              >
                <div style="position:relative;width:100%;aspect-ratio:16/9;background-color:var(--fallback-b2,oklch(var(--b2)));overflow:hidden;">
                  {img.doc.url && (
                    <ImagePicture doc={img.doc} alt={img.alt} mediaBaseUrl={mediaBaseUrl} />
                  )}
                  <div
                    class="hidden"
                    data-gallery-slide-caption
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: img.captionHtml ?? "" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Previous button */}
        <button
          type="button"
          data-gallery-prev
          class="btn btn-circle btn-ghost btn-sm absolute left-3 top-1/2 z-10 -translate-y-1/2 bg-base-300/80 shadow-md backdrop-blur-sm pointer-events-auto"
          aria-label="Previous slide"
          dangerouslySetInnerHTML={{ __html: CHEVRON_LEFT_SVG }}
        />

        {/* Next button */}
        <button
          type="button"
          data-gallery-next
          class="btn btn-circle btn-ghost btn-sm absolute right-3 top-1/2 z-10 -translate-y-1/2 bg-base-300/80 shadow-md backdrop-blur-sm pointer-events-auto"
          aria-label="Next slide"
          dangerouslySetInnerHTML={{ __html: CHEVRON_RIGHT_SVG }}
        />

        {/* Slide counter */}
        <div
          data-gallery-indicator
          class="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-base-300/80 px-3 py-1 text-xs font-medium text-base-content/70 backdrop-blur-sm"
          aria-live="polite"
          aria-atomic="true"
        >
          1 / {total}
        </div>
      </div>
      <figcaption
        data-gallery-caption
        data-fig-label="Fig 1"
        class={initialHasCaption ? "has-caption" : "no-caption"}
        dangerouslySetInnerHTML={initialHasCaption ? { __html: initialCaptionHtml } : undefined}
      />
    </figure>
  );
}
