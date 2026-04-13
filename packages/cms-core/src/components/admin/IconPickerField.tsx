"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  FieldDescription,
  FieldLabel,
  ReactSelect,
  fieldBaseClass,
  useField,
} from "@payloadcms/ui";
import type { ReactSelectOption as Option } from "@payloadcms/ui";
import type { TextFieldClientComponent } from "payload";
import { components as reactSelectComponents } from "react-select";

import { parseIconValueStrict } from "../../lib/icons";
import { getPhosphorIconSvgUrl } from "../../lib/icons";
import {
  findSimpleIconOptions,
  getSimpleIconCdnUrl,
  SIMPLE_ICON_OPTIONS,
} from "../../lib/icons";
import {
  findPhosphorIconOptions,
  PHOSPHOR_ICON_OPTIONS,
} from "../../lib/icons";

type IconSource = "simple-icons" | "phosphor";
type IconOption = Option & { previewUrl: string; source: IconSource };

const RESULT_LIMIT = 50;

const toSimpleIconOption = (icon: {
  title: string;
  slug: string;
}): IconOption => {
  return {
    label: icon.title,
    value: `si:${icon.slug}`,
    source: "simple-icons",
    previewUrl: getSimpleIconCdnUrl(icon.slug, { color: "ffffff", size: 18 }),
  };
};

const toPhosphorIconOption = (icon: { name: string }): IconOption => {
  return {
    label: icon.name,
    value: `ph:${icon.name}`,
    source: "phosphor",
    previewUrl: getPhosphorIconSvgUrl(icon.name),
  };
};

const previewImageStyle = (option: IconOption): { filter?: string } => {
  if (option.source === "phosphor") {
    return { filter: "brightness(0) invert(1)" };
  }

  return {};
};

export const IconPickerField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path });
  const storedValue = typeof value === "string" ? value.trim() : "";

  const parsed = useMemo(
    () => parseIconValueStrict(storedValue),
    [storedValue],
  );

  const [source, setSource] = useState<IconSource>(
    parsed?.source ?? "simple-icons",
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (parsed) {
      setSource(parsed.source);
    }
  }, [parsed]);

  const selectedOption = useMemo((): IconOption | undefined => {
    if (!parsed) {
      return undefined;
    }

    if (parsed.source === "simple-icons") {
      const icon = SIMPLE_ICON_OPTIONS.find(
        (option) => option.slug === parsed.slug,
      );
      return icon ? toSimpleIconOption(icon) : undefined;
    }

    const icon = PHOSPHOR_ICON_OPTIONS.find(
      (option) => option.name === parsed.name,
    );
    return icon ? toPhosphorIconOption(icon) : undefined;
  }, [parsed]);

  const options = useMemo((): IconOption[] => {
    if (source === "simple-icons") {
      return findSimpleIconOptions(searchQuery, RESULT_LIMIT).map(
        toSimpleIconOption,
      );
    }

    return findPhosphorIconOptions(searchQuery, RESULT_LIMIT).map(
      toPhosphorIconOption,
    );
  }, [source, searchQuery]);

  const handleSourceToggle = useCallback(
    (next: IconSource) => {
      setSource(next);
      setValue("");
      setSearchQuery("");
    },
    [setValue],
  );

  const selectComponents = useMemo(() => {
    return {
      Option: (props: any) => {
        const option = props.data as IconOption;

        return (
          <reactSelectComponents.Option {...props}>
            <span
              style={{
                alignItems: "center",
                display: "inline-flex",
                gap: "8px",
              }}
            >
              <img
                alt=""
                aria-hidden="true"
                height={16}
                src={option.previewUrl}
                style={previewImageStyle(option)}
                width={16}
              />
              <span>{String(option.label)}</span>
            </span>
          </reactSelectComponents.Option>
        );
      },
      SingleValue: (props: any) => {
        const option = props.data as IconOption;

        return (
          <reactSelectComponents.SingleValue {...props}>
            <span
              style={{
                alignItems: "center",
                display: "inline-flex",
                gap: "8px",
              }}
            >
              <img
                alt=""
                aria-hidden="true"
                height={16}
                src={option.previewUrl}
                style={previewImageStyle(option)}
                width={16}
              />
              <span>{String(option.label)}</span>
            </span>
          </reactSelectComponents.SingleValue>
        );
      },
    };
  }, []);

  const handleChange = useCallback(
    (option: Option | Option[]) => {
      if (!option || Array.isArray(option)) {
        setValue("");
        return;
      }

      const selectedValue = String(option.value).trim();
      setValue(selectedValue);
    },
    [setValue],
  );

  const fieldLabel = typeof field.label === "string" ? field.label : "Icon";

  return (
    <div className={fieldBaseClass}>
      <FieldLabel label={fieldLabel} path={path} />

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
        <button
          type="button"
          onClick={() => handleSourceToggle("simple-icons")}
          style={{
            padding: "4px 12px",
            fontSize: "12px",
            fontWeight: source === "simple-icons" ? 600 : 400,
            background:
              source === "simple-icons"
                ? "var(--theme-elevation-150)"
                : "transparent",
            color: "var(--theme-text)",
            border: "none",
            cursor: "pointer",
          }}
        >
          Simple Icons
        </button>
        <button
          type="button"
          onClick={() => handleSourceToggle("phosphor")}
          style={{
            padding: "4px 12px",
            fontSize: "12px",
            fontWeight: source === "phosphor" ? 600 : 400,
            background:
              source === "phosphor"
                ? "var(--theme-elevation-150)"
                : "transparent",
            color: "var(--theme-text)",
            border: "none",
            borderLeft: "1px solid var(--theme-elevation-150)",
            cursor: "pointer",
          }}
        >
          Phosphor
        </button>
      </div>

      <ReactSelect
        isClearable
        isSearchable
        components={selectComponents}
        onChange={handleChange}
        onInputChange={(val) => setSearchQuery(val)}
        options={options}
        placeholder={"Search brands or frameworks"}
        value={selectedOption}
      />

      <FieldDescription description={"Search the catalogue"} path={path} />
    </div>
  );
};
