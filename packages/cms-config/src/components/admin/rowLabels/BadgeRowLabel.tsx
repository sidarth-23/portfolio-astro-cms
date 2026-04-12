"use client";

import { useRowLabel } from "@payloadcms/ui";

import { formatRowLabel, getTrimmedString } from "./utils";
import { getSimpleIconCdnUrl } from "../../../lib/simpleIconsCatalog";

type BadgeRowData = {
  value?: unknown;
  iconSlug?: unknown;
};

export function BadgeRowLabel() {
  const { data, rowNumber } = useRowLabel<BadgeRowData>();
  const value = getTrimmedString(data?.value);
  const iconSlug = getTrimmedString(data?.iconSlug);
  const label = iconSlug ? `${value ?? "Badge"} (${iconSlug})` : value;

  const text = formatRowLabel({
    label,
    noun: "Badge",
    rowNumber,
  });

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: "1rem",
        pointerEvents: "none",
        width: "100%",
      }}
    >
      <span>{text}</span>
      {iconSlug && (
        <img
          alt={iconSlug}
          height={16}
          src={getSimpleIconCdnUrl(iconSlug, { color: "white", size: 16 })}
          style={{ flexShrink: 0 }}
          width={16}
        />
      )}
    </div>
  );
}
