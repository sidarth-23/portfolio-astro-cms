"use client";

import { useRowLabel } from "@payloadcms/ui";
import { formatRowLabel, getTrimmedString } from "./utils";
import { parseIconValue } from "@sidshub/cms-lib-icons";

type BadgeRowData = {
  value?: unknown;
  icon?: unknown;
};

export function BadgeRowLabel() {
  const { data, rowNumber } = useRowLabel<BadgeRowData>();
  const value = getTrimmedString(data?.value);
  const parsed = parseIconValue(getTrimmedString(data?.icon));
  const previewUrl = parsed ? parsed.provider.getCdnPreviewUrl(parsed.key) : null;
  const iconLabel = parsed?.key ?? null;
  const previewStyle = parsed?.provider.previewImageStyle
    ? { ...parsed.provider.previewImageStyle, flexShrink: 0 as const }
    : undefined;

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
