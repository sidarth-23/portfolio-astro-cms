/** @jsxImportSource preact */
import {
  siTypescript,
  siJavascript,
  siHtml5,
  siCss,
  siPython,
  siGo,
  siRust,
  siGnubash,
  siJson,
  siYaml,
  siReact,
  type SimpleIcon,
} from "simple-icons";
import type { CodeProps } from "../types";

const LANGUAGE_ICONS: Record<string, SimpleIcon> = {
  javascript: siJavascript,
  typescript: siTypescript,
  jsx: siReact,
  tsx: siReact,
  html: siHtml5,
  css: siCss,
  python: siPython,
  go: siGo,
  rust: siRust,
  bash: siGnubash,
  json: siJson,
  yaml: siYaml,
};

const LanguageIcon = ({ language }: { language: string }) => {
  const icon = LANGUAGE_ICONS[language];
  if (!icon) return null;
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      fill="currentColor"
      class="shrink-0"
      aria-label={icon.title}
    >
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
};

const CopyIcon = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="shrink-0"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

export function Code(props: CodeProps) {
  if (props.mode === "multiple") {
    const { entries, caption } = props;
    const captionText = caption?.trim() ?? "";
    const hasCaption = captionText.length > 0;
    return (
      <figure
        class="code-block-figure overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shadow-lg"
        data-code-tabs
        data-active-classes="font-medium text-gray-900 dark:text-gray-100 border-gray-900 dark:border-gray-100"
        data-inactive-classes="font-normal text-gray-500 dark:text-gray-400 border-transparent"
      >
        {/* Tab bar */}
        <div class="code-panel-header flex items-center border-b border-gray-200 dark:border-gray-700">
          <div class="flex min-w-0 flex-1" data-tabs-container>
            <div class="flex" role="tablist" data-tabs-list>
              {entries.map((entry, i) => (
                <button
                  key={i}
                  data-tab-index={String(i)}
                  type="button"
                  role="tab"
                  class={`inline-flex items-center h-8 rounded-none border-x-0 border-t-0 border-b-2 -mb-px px-3 text-sm bg-transparent hover:bg-transparent ${
                    i === 0
                      ? "font-medium text-gray-900 dark:text-gray-100 border-gray-900 dark:border-gray-100"
                      : "font-normal text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                  aria-selected={i === 0 ? "true" : "false"}
                >
                  {entry.name}
                </button>
              ))}
            </div>
          </div>

          {/* Overflow dropdown */}
          <div class="relative hidden self-center pr-1" data-tabs-dropdown>
            <button
              type="button"
              tabIndex={0}
              class="inline-flex items-center justify-center w-6 h-6 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
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
            <ul
              tabIndex={0}
              class="absolute right-0 top-full z-10 w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 p-1 shadow-xl"
              data-tabs-dropdown-list
            >
              {/* Populated by JS */}
            </ul>
          </div>
        </div>

        {/* Code panels */}
        <div class="code-panel-surface relative">
          <div class="code-panel-actions absolute right-3 top-4 z-10 flex items-center gap-1">
            {entries.map((entry, i) => (
              <div
                key={i}
                data-tab-icon={String(i)}
                hidden={i !== 0}
                class="flex items-center p-1 text-gray-500 dark:text-gray-400"
                aria-label={`Language ${entry.language}`}
                title={entry.language}
              >
                <LanguageIcon language={entry.language} />
              </div>
            ))}
            <button
              type="button"
              data-code-copy
              class="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-200/70 dark:bg-gray-700/70 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
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

        <figcaption
          class={`code-block-caption border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 h-8 flex items-center text-xs text-gray-500 dark:text-gray-400 ${
            hasCaption ? "has-caption" : "no-caption"
          }`}
        >
          {hasCaption && (
            <span class="code-block-caption-text">{captionText}</span>
          )}
        </figcaption>
      </figure>
    );
  }

  // Single mode
  const { language, highlightedHtml, caption } = props;
  const captionText = caption?.trim() ?? "";
  const hasCaption = captionText.length > 0;

  return (
    <figure class="code-block-figure overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shadow-lg">
      <div class="code-panel-surface relative">
        <div class="code-panel-actions absolute right-3 top-4 z-10 flex items-center gap-1">
          <span
            class="flex items-center p-1 text-gray-500 dark:text-gray-400"
            aria-label={`Language ${language}`}
            title={language}
          >
            <LanguageIcon language={language} />
          </span>
          <button
            type="button"
            data-code-copy
            class="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-200/70 dark:bg-gray-700/70 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
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

      <figcaption
        class={`code-block-caption border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 h-8 flex items-center text-xs text-gray-500 dark:text-gray-400 ${
          hasCaption ? "has-caption" : "no-caption"
        }`}
      >
        {hasCaption && (
          <span class="code-block-caption-text">{captionText}</span>
        )}
      </figcaption>
    </figure>
  );
}
