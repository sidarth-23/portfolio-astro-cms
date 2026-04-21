/** @jsxImportSource preact */
import { createUpload } from "@/web/html/shared/createUpload";

export const Upload = createUpload({
  frameStyle:
    "position:relative;width:100%;aspect-ratio:16/9;background-color:var(--fallback-b2,oklch(var(--b2)));overflow:hidden;border-radius:0.5rem;",
});
