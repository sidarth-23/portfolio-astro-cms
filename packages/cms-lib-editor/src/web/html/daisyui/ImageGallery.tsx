/** @jsxImportSource preact */
import { createImageGallery } from "@/web/html/shared/createImageGallery";

export const ImageGallery = createImageGallery({
  slideFrameClass: "",
  slideFrameStyle:
    "position:relative;width:100%;aspect-ratio:16/9;background-color:var(--fallback-b2,oklch(var(--b2)));overflow:hidden;",
  prevButtonClass:
    "btn btn-circle btn-ghost btn-sm absolute left-3 top-1/2 z-10 -translate-y-1/2 bg-base-300/80 shadow-md backdrop-blur-sm pointer-events-auto",
  nextButtonClass:
    "btn btn-circle btn-ghost btn-sm absolute right-3 top-1/2 z-10 -translate-y-1/2 bg-base-300/80 shadow-md backdrop-blur-sm pointer-events-auto",
  indicatorClass:
    "absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-base-300/80 px-3 py-1 text-xs font-medium text-base-content/70 backdrop-blur-sm",
});
