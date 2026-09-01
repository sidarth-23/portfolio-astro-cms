/** @jsxImportSource preact */
import type { CodeProps } from "@/lib/rich-text/html/types";
import { CopyIcon, LanguageIcon } from "@/lib/rich-text/html/shared/codeIcons";

type CodeThemeConfig = {
  figureClass: string;
  activeClasses: string;
  inactiveClasses: string;
  headerClass: string;
  tabsWrapperClass?: string;
  tabsListClass?: string;
  tabBaseClass: string;
  tabActiveClass: string;
  tabInactiveClass: string;
  dropdownWrapperClass: string;
  dropdownButtonClass: string;
  dropdownListClass: string;
  iconClass: string;
  copyButtonClass: string;
  captionClass: string;
};

export function createCode(config: CodeThemeConfig) {
  return function Code(props: CodeProps) {
    if (props.mode === "multiple") {
      const { entries, caption } = props;
      const captionText = caption?.trim() ?? "";
      const hasCaption = captionText.length > 0;
      return (
        <figure
          class={config.figureClass}
          data-code-tabs
          data-active-classes={config.activeClasses}
          data-inactive-classes={config.inactiveClasses}
        >
          <div class={config.headerClass}>
            <div class={config.tabsWrapperClass ?? "flex min-w-0 flex-1"} data-tabs-container>
              <div class={config.tabsListClass ?? "flex"} role="tablist" data-tabs-list>
                {entries.map((entry, i) => (
                  <button
                    key={i}
                    data-tab-index={String(i)}
                    type="button"
                    role="tab"
                    class={`${config.tabBaseClass} ${i === 0 ? config.tabActiveClass : config.tabInactiveClass}`}
                    aria-selected={i === 0 ? "true" : "false"}
                  >
                    {entry.name}
                  </button>
                ))}
              </div>
            </div>

            <div class={config.dropdownWrapperClass} data-tabs-dropdown>
              <button
                type="button"
                tabIndex={0}
                class={config.dropdownButtonClass}
                aria-label="More files"
              >
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
              <ul tabIndex={0} class={config.dropdownListClass} data-tabs-dropdown-list></ul>
            </div>
          </div>

          <div class="code-panel-surface relative">
            <div class="code-panel-actions absolute right-3 top-2 z-10 flex items-center gap-1">
              {entries.map((entry, i) => (
                <div
                  key={i}
                  data-tab-icon={String(i)}
                  hidden={i !== 0}
                  class={config.iconClass}
                  aria-label={`Language ${entry.language}`}
                  title={entry.language}
                >
                  <LanguageIcon language={entry.language} />
                </div>
              ))}
              <button
                type="button"
                data-code-copy
                class={config.copyButtonClass}
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

          <figcaption class={`${config.captionClass} ${hasCaption ? "has-caption" : "no-caption"}`}>
            {hasCaption && <span class="code-block-caption-text">{captionText}</span>}
          </figcaption>
        </figure>
      );
    }

    const { language, highlightedHtml, caption } = props;
    const captionText = caption?.trim() ?? "";
    const hasCaption = captionText.length > 0;

    return (
      <figure class={config.figureClass}>
        <div class="code-panel-surface relative">
          <div class="code-panel-actions absolute right-3 top-2 z-10 flex items-center gap-1">
            <span class={config.iconClass} aria-label={`Language ${language}`} title={language}>
              <LanguageIcon language={language} />
            </span>
            <button
              type="button"
              data-code-copy
              class={config.copyButtonClass}
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

        <figcaption class={`${config.captionClass} ${hasCaption ? "has-caption" : "no-caption"}`}>
          {hasCaption && <span class="code-block-caption-text">{captionText}</span>}
        </figcaption>
      </figure>
    );
  };
}
