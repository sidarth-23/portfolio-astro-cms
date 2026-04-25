/** @jsxImportSource preact */
import { createUpload } from "@/web/html/shared/createUpload";

export const Upload = createUpload({
  frameClass: "relative w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800",
  frameStyle: "aspect-ratio:16/9;",
});
