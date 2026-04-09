"use client";

import { useRowLabel } from "@payloadcms/ui";

import { formatRowLabel, getTrimmedString } from "./utils";

type SectionRowData = {
  title?: unknown;
  name?: unknown;
};

export function SectionRowLabel() {
  const { data, rowNumber } = useRowLabel<SectionRowData>();
  const title = getTrimmedString(data?.title) ?? getTrimmedString(data?.name);

  return formatRowLabel({
    label: title,
    noun: "Section",
    rowNumber,
  });
}
