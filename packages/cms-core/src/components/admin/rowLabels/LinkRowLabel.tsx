"use client";

import { useRowLabel } from "@payloadcms/ui";

import { parseIconValueStrict } from "@/lib/icons";
import { formatRowLabel, getTrimmedString } from "./utils";

type LinkRowData = {
  icon?: unknown;
  label?: unknown;
};

export function LinkRowLabel() {
  const { data, rowNumber } = useRowLabel<LinkRowData>();

  const iconValue = parseIconValueStrict(getTrimmedString(data?.icon));
  let iconLabel: string | null = null;

  if (iconValue?.source === "simple-icons") {
    iconLabel = iconValue.slug;
  } else if (iconValue?.source === "phosphor") {
    iconLabel = iconValue.name;
  }

  const label = iconLabel ?? getTrimmedString(data?.label);

  return formatRowLabel({
    label,
    noun: "Link",
    rowNumber,
  });
}
