/** @jsxImportSource preact */
import arrowUpRightSvg from "@phosphor-icons/core/assets/regular/arrow-up-right.svg?raw";
import type { FootnotesProps } from "@/web/html/types";

type FootnotesThemeConfig = {
  cardBodyClass: string;
  cardClass: string;
  itemBodyClass: string;
  itemClass: string;
  linkClass: string;
  listClass: string;
  sectionClass: string;
  titleClass: string;
};

export function createFootnotes(config: FootnotesThemeConfig) {
  return function Footnotes({ title, items }: FootnotesProps) {
    return (
      <section class={config.sectionClass}>
        <div class={config.cardClass}>
          <div class={config.cardBodyClass}>
            <h2 class={config.titleClass}>{title}</h2>
            <ol class={config.listClass}>
              {items.map((item) => (
                <li id={item.id} key={item.id} class={config.itemClass}>
                  <div class={config.itemBodyClass}>
                    <div dangerouslySetInnerHTML={{ __html: item.bodyHtml }} />
                    {item.referenceHref && (
                      <a
                        class={config.linkClass}
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
  };
}
