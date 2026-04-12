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

type SingleCodeProps = {
  mode: "single";
  language: string;
  highlightedHtml: string;
  caption?: string | null;
};

type MultipleCodeProps = {
  mode: "multiple";
  entries: Array<{ name: string; language: string; highlightedHtml: string }>;
  caption?: string | null;
};

type Props = SingleCodeProps | MultipleCodeProps;

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

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

export function Code(props: Props) {
  if (props.mode === "multiple") {
    const { entries, caption } = props;
    return (
      <figure
        class="code-block-figure overflow-hidden rounded-xl border border-base-content/15 bg-base-300 shadow-lg"
        data-code-tabs
      >
        {/* Tab bar */}
        <div
          class="flex items-center gap-2 border-b border-base-content/15 bg-base-200 p-2"
        >
          {/* Scrollable tab list */}
          <div class="flex min-w-0 flex-1 overflow-hidden" data-tabs-container>
            <div class="tabs tabs-border tabs-sm" role="tablist" data-tabs-list>
              {entries.map((entry, i) => (
                <button
                  key={i}
                  data-tab-index={String(i)}
                  type="button"
                  role="tab"
                  class={`tab whitespace-nowrap px-3 text-xs normal-case ${
                    i === 0
                      ? "tab-active font-medium"
                      : "text-base-content/65 hover:text-base-content font-normal"
                  }`}
                  aria-selected={i === 0 ? "true" : "false"}
                >
                  {entry.name}
                </button>
              ))}
            </div>
          </div>

          {/* Overflow dropdown */}
          <div
            class="dropdown dropdown-end hidden self-center"
            data-tabs-dropdown
          >
            <button
              type="button"
              tabIndex={0}
              class="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content"
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
              class="dropdown-content z-[1] menu menu-xs w-44 rounded-lg border border-base-content/15 bg-base-300 p-1 shadow-xl"
              data-tabs-dropdown-list
            >
              {/* Populated by JS */}
            </ul>
          </div>

          {/* Right: active language icon + copy */}
          <div class="flex items-center gap-1 rounded-md border border-base-content/20 bg-base-content/5 p-1">
            {entries.map((entry, i) => (
              <div
                key={i}
                data-tab-icon={String(i)}
                hidden={i !== 0}
                class="flex items-center px-1 text-base-content/70"
                aria-label={`Language ${entry.language}`}
                title={entry.language}
              >
                <LanguageIcon language={entry.language} />
              </div>
            ))}
            <button
              type="button"
              data-code-copy
              class="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content"
              aria-label="Copy code"
              title="Copy code"
            >
              <CopyIcon />
            </button>
          </div>
        </div>

        {/* Code panels */}
        {entries.map((entry, i) => (
          <div
            key={i}
            data-tab-panel={String(i)}
            class="code-panel overflow-x-auto text-sm"
            hidden={i !== 0}
            dangerouslySetInnerHTML={{ __html: entry.highlightedHtml }}
          />
        ))}

        {caption && (
          <figcaption class="code-block-caption border-t border-base-content/10 bg-base-content/5 px-4 py-2 text-xs text-base-content/55">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // Single mode — no header, just code with absolute overlay
  const { language, highlightedHtml, caption } = props;

  return (
    <figure class="code-block-figure relative overflow-hidden rounded-xl border border-base-content/15 bg-base-300 shadow-lg">
      {/* Always-visible actions */}
      <div class="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md border border-base-content/20 bg-base-content/10 p-1 backdrop-blur-sm">
        <span
          class="flex items-center px-1 text-base-content/70"
          aria-label={`Language ${language}`}
          title={language}
        >
          <LanguageIcon language={language} />
        </span>
        <button
          type="button"
          data-code-copy
          class="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content"
          aria-label="Copy code"
          title="Copy code"
        >
          <CopyIcon />
        </button>
      </div>

      {/* Code area */}
      <div
        class="code-panel overflow-x-auto text-sm"
        data-code-panel
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />

      {caption && (
        <figcaption class="code-block-caption border-t border-base-content/10 bg-base-content/5 px-4 py-2 text-xs text-base-content/55">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
