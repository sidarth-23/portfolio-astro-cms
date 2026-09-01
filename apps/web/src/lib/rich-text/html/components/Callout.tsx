/** @jsxImportSource preact */
import type { CalloutProps } from "@/lib/rich-text/html/types";

const variantClasses: Record<string, string> = {
  neutral: "alert",
  info: "alert alert-info",
  success: "alert alert-success",
  warning: "alert alert-warning",
  danger: "alert alert-error",
  note: "alert alert-info",
  tip: "alert alert-success",
};

export function Callout({ variant, title, contentHtml, wrapperClass }: CalloutProps) {
  const variantClass = variantClasses[variant] ?? variantClasses.info;
  const outerClass = [wrapperClass, variantClass].filter(Boolean).join(" ");

  return (
    <aside class={outerClass} role="note">
      <div class="grid gap-2">
        {title && <strong class="font-semibold">{title}</strong>}
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </div>
    </aside>
  );
}
