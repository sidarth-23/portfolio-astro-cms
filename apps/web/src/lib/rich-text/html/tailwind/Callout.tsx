/** @jsxImportSource preact */
import { createCallout } from "@/lib/rich-text/html/shared/createCallout";

const variantClasses: Record<string, string> = {
  neutral: "border-l-4 border-gray-400 bg-gray-50 dark:bg-gray-800/50",
  info: "border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20",
  success: "border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20",
  warning: "border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
  danger: "border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20",
  // blog profile
  note: "border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20",
  tip: "border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20",
};

export const Callout = createCallout({
  baseClass: "rounded-lg p-4",
  fallbackVariant: "info",
  variantClasses,
});
