/** @jsxImportSource preact */
import caretLeftSvg from "@phosphor-icons/core/assets/regular/caret-left.svg?raw";
import caretRightSvg from "@phosphor-icons/core/assets/regular/caret-right.svg?raw";
import { ImagePicture } from "@/lib/rich-text/util/image";
import type { ImageGalleryProps } from "@/lib/rich-text/html/types";
export function ImageGallery({ images, mediaBaseUrl }: ImageGalleryProps) {
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
                <div>
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
        <button
          type="button"
          data-gallery-prev
          class="btn btn-circle btn-ghost btn-sm absolute left-3 top-1/2 z-10 -translate-y-1/2 bg-base-300/80 shadow-md backdrop-blur-sm pointer-events-auto"
          aria-label="Previous slide"
          dangerouslySetInnerHTML={{ __html: caretLeftSvg }}
        />
        <button
          type="button"
          data-gallery-next
          class="btn btn-circle btn-ghost btn-sm absolute right-3 top-1/2 z-10 -translate-y-1/2 bg-base-300/80 shadow-md backdrop-blur-sm pointer-events-auto"
          aria-label="Next slide"
          dangerouslySetInnerHTML={{ __html: caretRightSvg }}
        />
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
