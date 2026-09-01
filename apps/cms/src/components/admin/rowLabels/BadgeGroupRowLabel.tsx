"use client";

import { useRowLabel } from "@payloadcms/ui";

import { formatRowLabel, getTrimmedString } from "./utils";

type BadgeGroupRowData = {
  title?: unknown;
};

export function BadgeGroupRowLabel() {
  const { data, rowNumber } = useRowLabel<BadgeGroupRowData>();
  const title = getTrimmedString(data?.title);

  return formatRowLabel({
    label: title,
    noun: "Badge Group",
    rowNumber,
  });
}
