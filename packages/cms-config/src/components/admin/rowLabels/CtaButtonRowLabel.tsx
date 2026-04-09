"use client";

import { useRowLabel } from "@payloadcms/ui";

import { formatRowLabel, getTrimmedString } from "./utils";

type CtaButtonRowData = {
  title?: unknown;
};

export function CtaButtonRowLabel() {
  const { data, rowNumber } = useRowLabel<CtaButtonRowData>();
  const label = getTrimmedString(data?.title);

  return formatRowLabel({
    label,
    noun: "Button",
    rowNumber,
  });
}
