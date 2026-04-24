/** @jsxImportSource preact */
import type { CalloutProps } from "@/web/html/types";

type CalloutThemeConfig = {
  baseClass?: string;
  fallbackVariant: string;
  variantClasses: Record<string, string>;
};

export function createCallout(config: CalloutThemeConfig) {
  return function Callout({ variant, title, contentHtml, wrapperClass }: CalloutProps) {
    const variantClass =
      config.variantClasses[variant] ?? config.variantClasses[config.fallbackVariant];
    const outerClass = [wrapperClass, variantClass, config.baseClass].filter(Boolean).join(" ");

    return (
      <aside class={outerClass} role="note">
        <div class="grid gap-2">
          {title && <strong class="font-semibold">{title}</strong>}
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </div>
      </aside>
    );
  };
}
