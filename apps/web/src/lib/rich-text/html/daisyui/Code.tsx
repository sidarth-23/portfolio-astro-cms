/** @jsxImportSource preact */
import { createCode } from "@/lib/rich-text/html/shared/createCode";

export const Code = createCode({
  figureClass:
    "code-block-figure overflow-hidden rounded-xl border border-base-content/10 bg-base-300 shadow-lg",
  activeClasses: "font-medium text-base-content border-base-content",
  inactiveClasses: "font-normal text-base-content/60 border-transparent",
  headerClass: "code-panel-header flex items-center border-b border-base-content/10",
  tabBaseClass:
    "btn btn-ghost btn-sm min-h-0 h-8 rounded-none border-x-0 border-t-0 border-b-2 -mb-px px-3 text-sm normal-case shadow-none hover:bg-transparent",
  tabActiveClass: "font-medium text-base-content border-base-content",
  tabInactiveClass: "font-normal text-base-content/60 border-transparent hover:text-base-content",
  dropdownWrapperClass: "dropdown dropdown-end hidden self-center pr-1",
  dropdownButtonClass:
    "btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content",
  dropdownListClass:
    "dropdown-content z-[1] menu menu-xs w-44 rounded-lg border border-base-content/15 bg-base-300 p-1 shadow-xl",
  iconClass: "flex items-center p-1 text-base-content/70",
  copyButtonClass:
    "btn btn-ghost btn-xs btn-square no-animation bg-base-content/10 text-base-content/70 hover:bg-base-content/15 hover:text-base-content",
  captionClass:
    "code-block-caption border-t border-base-content/10 bg-base-content/5 px-2 h-8 flex items-center text-xs",
});
