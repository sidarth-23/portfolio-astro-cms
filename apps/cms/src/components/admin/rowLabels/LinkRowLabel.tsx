"use client";

import { useRowLabel } from "@payloadcms/ui";

import { parseIconValue } from "@sidshub/icon-catalog";
import { formatRowLabel, getTrimmedString } from "./utils";

type LinkRowData = {
  icon?: unknown;
  label?: unknown;
};

export function LinkRowLabel() {
  const { data, rowNumber } = useRowLabel<LinkRowData>();

  const parsed = parseIconValue(getTrimmedString(data?.icon));
  const label = parsed?.key ?? getTrimmedString(data?.label);

  return formatRowLabel({
    label,
    noun: "Link",
    rowNumber,
  });
}
