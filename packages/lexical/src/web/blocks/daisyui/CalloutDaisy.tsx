/** @jsxImportSource preact */
import type { CalloutProps } from "../types";

const variantToAlertClass: Record<string, string> = {
  neutral: "alert",
  info: "alert alert-info",
  success: "alert alert-success",
  warning: "alert alert-warning",
  danger: "alert alert-error",
  // blog profile
  note: "alert alert-info",
  tip: "alert alert-success",
};

export function CalloutDaisy({ variant, title, contentHtml, wrapperClass }: CalloutProps) {
  const alertClass = variantToAlertClass[variant] ?? "alert alert-info";
  const outerClass = wrapperClass ? `${wrapperClass} ${alertClass}` : alertClass;

  return (
    <aside class={outerClass} role="note">
      <div class="grid gap-2">
        {title && <strong class="font-semibold">{title}</strong>}
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </div>
    </aside>
  );
}
