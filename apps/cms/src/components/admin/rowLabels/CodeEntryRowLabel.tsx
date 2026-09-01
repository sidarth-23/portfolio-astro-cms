"use client";

import { useRowLabel } from "@payloadcms/ui";

import { formatRowLabel, getTrimmedString } from "./utils";

type CodeEntryRowData = {
  name?: unknown;
  language?: unknown;
};

export function CodeEntryRowLabel() {
  const { data, rowNumber } = useRowLabel<CodeEntryRowData>();
  const label = getTrimmedString(data?.name);

  return formatRowLabel({
    label,
    noun: "Entry",
    rowNumber,
  });
}
