/** @jsxImportSource preact */

type Props = {
  language: string;
  highlightedHtml: string;
  filename?: string | null;
  caption?: string | null;
};

export function Code({ language: _language, highlightedHtml, filename, caption }: Props) {
  return (
    <section>
      <figure class="rounded-xl border border-base-content/15 overflow-hidden bg-base-300/40">
        {filename && (
          <figcaption class="px-4 py-2 text-xs font-medium border-b border-base-content/10 opacity-80">
            {filename}
          </figcaption>
        )}
        <div class="overflow-x-auto text-sm" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        {caption && (
          <figcaption class="px-4 py-2 text-xs opacity-70">{caption}</figcaption>
        )}
      </figure>
    </section>
  );
}
