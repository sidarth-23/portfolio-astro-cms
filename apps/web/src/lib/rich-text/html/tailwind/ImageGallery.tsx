/** @jsxImportSource preact */
import { createImageGallery } from "@/lib/rich-text/html/shared/createImageGallery";

export const ImageGallery = createImageGallery({
  slideFrameClass: "",
  slideFrameStyle: "",
  prevButtonClass:
    "absolute left-3 top-1/2 z-10 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 shadow-md backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-900 pointer-events-auto",
  nextButtonClass:
    "absolute right-3 top-1/2 z-10 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 shadow-md backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-900 pointer-events-auto",
  indicatorClass:
    "absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/80 dark:bg-gray-900/80 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 backdrop-blur-sm",
});
