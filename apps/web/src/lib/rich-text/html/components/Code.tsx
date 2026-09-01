/** @jsxImportSource preact */
import type { CodeProps } from "@/lib/rich-text/html/types";
import { CopyIcon, LanguageIcon } from "./codeIcons";

const figureClass =
  "code-block-figure overflow-hidden rounded-xl border border-base-content/10 bg-base-300 shadow-lg";
const tabBaseClass =
  "btn btn-ghost btn-sm min-h-0 h-8 rounded-none border-x-0 border-t-0 border-b-2 -mb-px px-3 text-sm normal-case shadow-none hover:bg-transparent";
const tabActiveClass = "font-medium text-base-content border-base-content";
const tabInactiveClass =
  "font-normal text-base-content/60 border-transparent hover:text-base-content";
const headerClass = "code-panel-header flex items-center border-b border-base-content/10";
const dropdownWrapperClass = "dropdown dropdown-end hidden self-center pr-1";
const dropdownButtonClass =
  "btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content";
const dropdownListClass =
  "dropdown-content z-[1] menu menu-xs w-44 rounded-lg border border-base-content/15 bg-base-300 p-1 shadow-xl";
const iconClass = "flex items-center p-1 text-base-content/70";
const copyButtonClass =
  "btn btn-ghost btn-xs btn-square no-animation bg-base-content/10 text-base-content/70 hover:bg-base-content/15 hover:text-base-content";
const captionClass =
  "code-block-caption border-t border-base-content/10 bg-base-content/5 px-2 h-8 flex items-center text-xs";

export function Code(props: CodeProps) {
  if (props.mode === "multiple") {
    const { entries, caption } = props;
    const captionText = caption?.trim() ?? "";
    const hasCaption = captionText.length > 0;
    return (
      <figure
        class={figureClass}
        data-code-tabs
        data-active-classes={tabActiveClass}
        data-inactive-classes={tabInactiveClass}
      >
        <div class={headerClass}>
          <div class="flex min-w-0 flex-1" data-tabs-container>
            <div class="flex" role="tablist" data-tabs-list>
              {entries.map((entry, i) => (
                <button
                  key={i}
                  data-tab-index={String(i)}
                  type="button"
                  role="tab"
                  class={`${tabBaseClass} ${i === 0 ? tabActiveClass : tabInactiveClass}`}
                  aria-selected={i === 0 ? "true" : "false"}
                >
                  {entry.name}
                </button>
              ))}
            </div>
          </div>
          <div class={dropdownWrapperClass} data-tabs-dropdown>
            <button type="button" tabIndex={0} class={dropdownButtonClass} aria-label="More files">
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <ul tabIndex={0} class={dropdownListClass} data-tabs-dropdown-list />
          </div>
        </div>
        <div class="code-panel-surface relative">
          <div class="code-panel-actions absolute right-3 top-2 z-10 flex items-center gap-1">
            {entries.map((entry, i) => (
              <div
                key={i}
                data-tab-icon={String(i)}
                hidden={i !== 0}
                class={iconClass}
                aria-label={`Language ${entry.language}`}
                title={entry.language}
              >
                <LanguageIcon language={entry.language} />
              </div>
            ))}
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
          {entries.map((entry, i) => (
            <div
              key={i}
              data-tab-panel={String(i)}
              class="code-panel code-panel-with-actions overflow-x-auto text-base"
              hidden={i !== 0}
              dangerouslySetInnerHTML={{ __html: entry.highlightedHtml }}
            />
          ))}
        </div>
        <figcaption class={`${captionClass} ${hasCaption ? "has-caption" : "no-caption"}`}>
          {hasCaption && <span class="code-block-caption-text">{captionText}</span>}
        </figcaption>
      </figure>
    );
  }

  const { language, highlightedHtml, caption } = props;
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
