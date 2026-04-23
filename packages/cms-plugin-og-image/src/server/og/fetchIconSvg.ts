import { resolveIconSvg, svgToDataUri } from "@sidshub/cms-icons";
import type { IconFetchFailureReason } from "../../types";

export type { IconFetchFailureReason };

export type IconFetchResult =
  | { ok: true; svg: string }
  | { ok: false; reason: IconFetchFailureReason; message: string };

export function fetchIconSvg(iconValue: string): IconFetchResult {
  const resolved = resolveIconSvg(iconValue);

  if (!resolved) {
    return {
      ok: false,
      reason: "invalid-format",
      message: `Could not resolve icon "${iconValue}". Expected "si:<slug>" or "ph:<name>".`,
    };
  }

  return { ok: true, svg: resolved.svg };
}

export { svgToDataUri };
