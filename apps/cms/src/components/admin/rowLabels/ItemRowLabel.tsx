"use client";

import { useRowLabel } from "@payloadcms/ui";

import { formatRowLabel, getTrimmedString } from "./utils";

type ItemRowData = {
  title?: unknown;
  subtitle?: unknown;
};

export function ItemRowLabel() {
  const { data, rowNumber } = useRowLabel<ItemRowData>();
  const title = getTrimmedString(data?.title) ?? getTrimmedString(data?.subtitle);

  return formatRowLabel({
    label: title,
    noun: "Item",
    rowNumber,
  });
}
