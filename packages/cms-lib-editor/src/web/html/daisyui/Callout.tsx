/** @jsxImportSource preact */
import { createCallout } from "@/web/html/shared/createCallout";

const variantClasses: Record<string, string> = {
  neutral: "alert",
  info: "alert alert-info",
  success: "alert alert-success",
  warning: "alert alert-warning",
  danger: "alert alert-error",
  // blog profile
  note: "alert alert-info",
  tip: "alert alert-success",
};

export const Callout = createCallout({
  fallbackVariant: "info",
  variantClasses,
});
