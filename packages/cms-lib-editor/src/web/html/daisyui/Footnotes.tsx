/** @jsxImportSource preact */
import { createFootnotes } from "@/web/html/shared/createFootnotes";

export const Footnotes = createFootnotes({
  sectionClass: "my-10",
  cardClass: "card bg-neutral text-neutral-content",
  cardBodyClass: "card-body",
  titleClass: "card-title text-lg mb-0 mt-2",
  listClass: "my-0 list-decimal space-y-2.5 ps-6",
  itemClass: "leading-relaxed",
  itemBodyClass: "flex items-start justify-between gap-3",
  linkClass: "mt-0.5 shrink-0 opacity-80 hover:opacity-100 [&>svg]:h-4 [&>svg]:w-4",
});
