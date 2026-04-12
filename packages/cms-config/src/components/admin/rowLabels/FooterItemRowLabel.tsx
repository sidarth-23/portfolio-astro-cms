"use client";

import { useRowLabel } from "@payloadcms/ui";

import { formatRowLabel, getTrimmedString } from "./utils";
import { SITE_FOOTER_TYPE_LABELS } from "../../../lib/options/footerItems";

type FooterItemRowData = {
  type?: unknown;
};

export function FooterItemRowLabel() {
  const { data, rowNumber } = useRowLabel<FooterItemRowData>();
  const type = getTrimmedString(data?.type);
  const label = type ? (SITE_FOOTER_TYPE_LABELS[type] ?? type) : undefined;

  return formatRowLabel({
    label,
    noun: "Link",
    rowNumber,
  });
}
