/** @jsxImportSource preact */
import { createFootnotes } from "@/web/html/shared/createFootnotes";

export const Footnotes = createFootnotes({
  sectionClass: "my-10",
  cardClass: "card bg-neutral text-neutral-content",
  cardBodyClass: "card-body",
  titleClass: "card-title text-lg",
  listClass: "list-decimal space-y-3 ps-5",
  itemClass: "leading-relaxed",
  itemBodyClass: "flex items-end justify-between gap-3",
  linkClass: "shrink-0 opacity-80 hover:opacity-100 [&>svg]:h-4 [&>svg]:w-4",
});
