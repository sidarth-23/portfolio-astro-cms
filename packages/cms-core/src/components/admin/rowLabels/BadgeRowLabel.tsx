"use client";

import { useRowLabel } from "@payloadcms/ui";

import { formatRowLabel, getTrimmedString } from "./utils";
import { parseIconValueStrict } from "../../../lib/icons";
import { getSimpleIconCdnUrl } from "../../../lib/icons";
import { getPhosphorIconSvgUrl } from "../../../lib/icons";

type BadgeRowData = {
  value?: unknown;
  icon?: unknown;
};

export function BadgeRowLabel() {
  const { data, rowNumber } = useRowLabel<BadgeRowData>();
  const value = getTrimmedString(data?.value);
  const iconValue = parseIconValueStrict(getTrimmedString(data?.icon));
  let previewUrl: string | null = null;
  let iconLabel: string | null = null;
  let previewStyle: { filter: string; flexShrink: 0 } | undefined;

  if (iconValue?.source === "simple-icons") {
    previewUrl = getSimpleIconCdnUrl(iconValue.slug, { color: "ffffff", size: 16 });
    iconLabel = iconValue.slug;
  } else if (iconValue?.source === "phosphor") {
    previewUrl = getPhosphorIconSvgUrl(iconValue.name);
    iconLabel = iconValue.name;
    previewStyle = { filter: "brightness(0) invert(1)", flexShrink: 0 };
  }

  const label = iconLabel ? `${value ?? "Badge"} (${iconLabel})` : value;

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
      {previewUrl && (
        <img
          alt={iconLabel ?? ""}
          height={16}
          src={previewUrl}
          style={previewStyle ?? { flexShrink: 0 }}
          width={16}
        />
      )}
    </div>
  );
}
