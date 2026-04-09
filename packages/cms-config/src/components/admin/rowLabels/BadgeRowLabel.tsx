"use client";

import { useRowLabel } from "@payloadcms/ui";

import { formatRowLabel, getTrimmedString } from "./utils";

type BadgeRowData = {
  value?: unknown;
};

export function BadgeRowLabel() {
  const { data, rowNumber } = useRowLabel<BadgeRowData>();
  const label = getTrimmedString(data?.value);

  return formatRowLabel({
    label,
    noun: "Badge",
    rowNumber,
  });
}
