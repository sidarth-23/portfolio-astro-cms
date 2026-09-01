/** @jsxImportSource preact */
import type { CodeProps } from "@/lib/rich-text/html/types";
import { CopyIcon, LanguageIcon } from "./codeIcons";

const figureClass =
  "code-block-figure overflow-hidden rounded-xl border border-base-content/10 bg-base-300 shadow-lg";
const iconClass = "flex items-center p-1 text-base-content/70";
const copyButtonClass =
  "btn btn-ghost btn-xs btn-square no-animation bg-base-content/10 text-base-content/70 hover:bg-base-content/15 hover:text-base-content";
const captionClass =
  "code-block-caption border-t border-base-content/10 bg-base-content/5 px-2 h-8 flex items-center text-xs";

export function Code({ language, highlightedHtml, caption }: CodeProps) {
  const captionText = caption?.trim() ?? "";
  const hasCaption = captionText.length > 0;
  return (
    <figure class={figureClass}>
      <div class="code-panel-surface relative">
        <div class="code-panel-actions absolute right-3 top-2 z-10 flex items-center gap-1">
          <span class={iconClass} aria-label={`Language ${language}`} title={language}>
            <LanguageIcon language={language} />
          </span>
          <button
            type="button"
            data-code-copy
            class={copyButtonClass}
            aria-label="Copy code"
            title="Copy code"
          >
            <CopyIcon />
          </button>
        </div>
        <div
          class="code-panel code-panel-with-actions overflow-x-auto text-base"
          data-code-panel
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </div>
      <figcaption class={`${captionClass} ${hasCaption ? "has-caption" : "no-caption"}`}>
        {hasCaption && <span class="code-block-caption-text">{captionText}</span>}
      </figcaption>
    </figure>
  );
}
