/** @jsxImportSource preact */

type Props = {
  variant: string;
  title?: string | null;
  contentHtml: string;
  /** Additional wrapper classes (e.g. `my-6` for inline lexical blocks) */
  wrapperClass?: string;
};

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

export function Callout({ variant, title, contentHtml, wrapperClass }: Props) {
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
