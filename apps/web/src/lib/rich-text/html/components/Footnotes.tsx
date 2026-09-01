/** @jsxImportSource preact */
import arrowUpRightSvg from "@phosphor-icons/core/assets/regular/arrow-up-right.svg?raw";
import type { FootnotesProps } from "@/lib/rich-text/html/types";

export function Footnotes({ title, items }: FootnotesProps) {
  return (
    <section class="my-10">
      <div class="card bg-neutral text-neutral-content">
        <div class="card-body">
          <h2 class="card-title text-lg mb-0 mt-2">{title}</h2>
          <ol class="my-0 list-decimal space-y-2.5 ps-6">
            {items.map((item) => (
              <li id={item.id} key={item.id} class="leading-relaxed">
                <div class="flex items-start justify-between gap-3">
                  <div dangerouslySetInnerHTML={{ __html: item.bodyHtml }} />
                  {item.referenceHref && (
                    <a
                      class="mt-0.5 shrink-0 opacity-80 hover:opacity-100 [&>svg]:h-4 [&>svg]:w-4"
                      href={item.referenceHref}
                      aria-label={item.referenceLabel ?? "Back to reference"}
                      title="Back to reference"
                      dangerouslySetInnerHTML={{ __html: arrowUpRightSvg }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
