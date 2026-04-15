/** @jsxImportSource preact */
import caretLeftSvg from "@phosphor-icons/core/assets/regular/caret-left.svg?raw";
import caretRightSvg from "@phosphor-icons/core/assets/regular/caret-right.svg?raw";
import { ImagePicture } from "@/web/util/image";
import type { ImageGalleryProps } from "@/web/html/types";

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
                <div
                  class="relative w-full overflow-hidden bg-gray-100 dark:bg-gray-800"
                  style="aspect-ratio:16/9;"
                >
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
          class="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 shadow-md backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-900 pointer-events-auto"
          aria-label="Previous slide"
          dangerouslySetInnerHTML={{ __html: caretLeftSvg }}
        />

        {/* Next button */}
        <button
          type="button"
          data-gallery-next
          class="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 shadow-md backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-900 pointer-events-auto"
          aria-label="Next slide"
          dangerouslySetInnerHTML={{ __html: caretRightSvg }}
        />

        {/* Slide counter */}
        <div
          data-gallery-indicator
          class="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/80 dark:bg-gray-900/80 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 backdrop-blur-sm"
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
