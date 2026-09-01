/** @jsxImportSource preact */
import { createFootnotes } from "@/lib/rich-text/html/shared/createFootnotes";

export const Footnotes = createFootnotes({
  sectionClass: "my-10",
  cardClass:
    "rounded-xl border border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
  cardBodyClass: "p-6",
  titleClass: "text-lg font-semibold",
  listClass: "list-decimal space-y-3 ps-5",
  itemClass: "leading-relaxed",
  itemBodyClass: "flex items-end justify-between gap-3",
  linkClass:
    "shrink-0 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 [&>svg]:h-4 [&>svg]:w-4",
});
