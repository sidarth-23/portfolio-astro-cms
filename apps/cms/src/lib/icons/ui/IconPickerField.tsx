"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ReactSelect } from "@payloadcms/ui/elements/ReactSelect";
import { FieldDescription } from "@payloadcms/ui/fields/FieldDescription";
import { FieldLabel } from "@payloadcms/ui/fields/FieldLabel";
import { fieldBaseClass } from "@payloadcms/ui/fields/shared";
import { useField } from "@payloadcms/ui/forms/useField";
import type { Option } from "@payloadcms/ui/elements/ReactSelect";
import type { TextFieldClientComponent } from "payload";
import { components as reactSelectComponents } from "react-select";
import type { OptionProps, SingleValueProps } from "react-select";

import { PROVIDERS, parseIconValue, findIconOptions } from "@sidshub/icon-catalog";
import type { IconProvider } from "@sidshub/icon-catalog";

// ---- Types ----

type PickerOption = Option & { previewUrl: string; previewStyle?: Record<string, string> };

// ---- Per-provider helpers ----

const toPickerOption =
  (provider: IconProvider) =>
  (icon: { label: string; key: string }): PickerOption => ({
    label: icon.label,
    value: `${provider.prefix}:${icon.key}`,
    previewUrl: provider.getCdnPreviewUrl(icon.key),
    previewStyle: provider.previewImageStyle,
  });

const RESULT_LIMIT = 50;

// ---- Component ----

export const IconPickerField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path });
  const storedValue = typeof value === "string" ? value.trim() : "";

  const parsed = useMemo(() => parseIconValue(storedValue), [storedValue]);

  const [activeSource, setActiveSource] = useState<string>(
    parsed?.provider.source ?? PROVIDERS[0]?.source ?? "",
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Sync the active tab when an external value is set
  useEffect(() => {
    if (parsed) setActiveSource(parsed.provider.source);
  }, [parsed]);

  const activeProvider = useMemo(
    () => PROVIDERS.find((p) => p.source === activeSource) ?? PROVIDERS[0],
    [activeSource],
  );

  const selectedOption = useMemo((): PickerOption | undefined => {
    if (!parsed) return undefined;
    const opt = parsed.provider.options.find((o) => o.key === parsed.key);
    return opt ? toPickerOption(parsed.provider)(opt) : undefined;
  }, [parsed]);

  const options = useMemo((): PickerOption[] => {
    if (!activeProvider) return [];
    return findIconOptions(activeProvider, searchQuery, RESULT_LIMIT).map(
      toPickerOption(activeProvider),
    );
  }, [activeProvider, searchQuery]);

  const handleSourceToggle = useCallback(
    (source: string) => {
      setActiveSource(source);
      setValue("");
      setSearchQuery("");
    },
    [setValue],
  );

  const handleChange = useCallback(
    (option: Option | Option[]) => {
      if (!option || Array.isArray(option)) {
        setValue("");
        return;
      }
      setValue(String(option.value).trim());
    },
    [setValue],
  );

  const selectComponents = useMemo(
    () => ({
      Option: (props: OptionProps<PickerOption, false>) => {
        const { previewUrl, previewStyle } = props.data;
        return (
          <reactSelectComponents.Option {...props}>
            <span style={{ alignItems: "center", display: "inline-flex", gap: "8px" }}>
              <img
                alt=""
                aria-hidden="true"
                height={16}
                src={previewUrl}
                style={previewStyle}
                width={16}
              />
              <span>{String(props.data.label)}</span>
            </span>
          </reactSelectComponents.Option>
        );
      },
      SingleValue: (props: SingleValueProps<PickerOption, false>) => {
        const { previewUrl, previewStyle } = props.data;
        return (
          <reactSelectComponents.SingleValue {...props}>
            <span style={{ alignItems: "center", display: "inline-flex", gap: "8px" }}>
              <img
                alt=""
                aria-hidden="true"
                height={16}
                src={previewUrl}
                style={previewStyle}
                width={16}
              />
              <span>{String(props.data.label)}</span>
            </span>
          </reactSelectComponents.SingleValue>
        );
      },
    }),
    [],
  );

  const fieldLabel = typeof field.label === "string" ? field.label : "Icon";

  return (
    <div className={fieldBaseClass}>
      <FieldLabel label={fieldLabel} path={path} />

      {/* Source tabs — rendered from PROVIDERS, no manual additions needed */}
      <div
        style={{
          display: "flex",
          marginBottom: "8px",
          border: "1px solid var(--theme-elevation-150)",
          borderRadius: "4px",
          overflow: "hidden",
          width: "fit-content",
        }}
      >
        {PROVIDERS.map((provider, i) => (
          <button
            key={provider.source}
            type="button"
            onClick={() => handleSourceToggle(provider.source)}
            style={{
              padding: "4px 12px",
              fontSize: "12px",
              fontWeight: activeSource === provider.source ? 600 : 400,
              background:
                activeSource === provider.source ? "var(--theme-elevation-150)" : "transparent",
              color: "var(--theme-text)",
              border: "none",
              borderLeft: i > 0 ? "1px solid var(--theme-elevation-150)" : "none",
              cursor: "pointer",
            }}
          >
            {provider.displayName}
          </button>
        ))}
      </div>

      <ReactSelect
        isClearable
        isSearchable
        components={selectComponents}
        onChange={handleChange}
        onInputChange={(val) => setSearchQuery(val)}
        options={options}
        placeholder={`Search ${activeProvider?.displayName ?? "icons"}`}
        value={selectedOption}
      />

      <FieldDescription
        description="Use picker values only. Avoid manual text edits."
        path={path}
      />
    </div>
  );
};
