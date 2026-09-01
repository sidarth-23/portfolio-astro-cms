/** @jsxImportSource preact */
import { createCode } from "@/lib/rich-text/html/shared/createCode";

export const Code = createCode({
  figureClass:
    "code-block-figure overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shadow-lg",
  activeClasses:
    "font-medium text-gray-900 dark:text-gray-100 border-gray-900 dark:border-gray-100",
  inactiveClasses: "font-normal text-gray-500 dark:text-gray-400 border-transparent",
  headerClass: "code-panel-header flex items-center border-b border-gray-200 dark:border-gray-700",
  tabBaseClass:
    "inline-flex items-center h-8 rounded-none border-x-0 border-t-0 border-b-2 -mb-px px-3 text-sm bg-transparent hover:bg-transparent",
  tabActiveClass:
    "font-medium text-gray-900 dark:text-gray-100 border-gray-900 dark:border-gray-100",
  tabInactiveClass:
    "font-normal text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200",
  dropdownWrapperClass: "relative hidden self-center pr-1",
  dropdownButtonClass:
    "inline-flex items-center justify-center w-6 h-6 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700",
  dropdownListClass:
    "absolute right-0 top-full z-10 w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 p-1 shadow-xl",
  iconClass: "flex items-center p-1 text-gray-500 dark:text-gray-400",
  copyButtonClass:
    "inline-flex items-center justify-center w-6 h-6 rounded bg-gray-200/70 dark:bg-gray-700/70 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200",
  captionClass:
    "code-block-caption border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 h-8 flex items-center text-xs text-gray-500 dark:text-gray-400",
});
