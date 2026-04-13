"use client";

import { useCallback, useMemo, useState } from "react";

import {
  FieldDescription,
  FieldLabel,
  ReactSelect,
  fieldBaseClass,
  useField,
} from "@payloadcms/ui";
import type { ReactSelectOption as Option } from "@payloadcms/ui";
import type { TextFieldClientComponent } from "payload";

import {
  findSimpleIconOptions,
  isSimpleIconSlug,
  SIMPLE_ICON_OPTIONS,
} from "../../lib/icons";

const RESULT_LIMIT = 50;

const toSelectOption = (icon: { title: string; slug: string }): Option => ({
  label: icon.title,
  value: icon.slug,
});

export const SimpleIconSlugField: TextFieldClientComponent = ({
  field,
  path,
}) => {
  const { value, setValue } = useField<string>({ path });
  const selectedSlug = typeof value === "string" ? value.trim() : "";
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOption = useMemo(() => {
    if (!selectedSlug) return undefined;
    const icon = SIMPLE_ICON_OPTIONS.find((o) => o.slug === selectedSlug);
    return icon ? toSelectOption(icon) : undefined;
  }, [selectedSlug]);

  const options = useMemo(() => {
    return findSimpleIconOptions(searchQuery, RESULT_LIMIT).map(toSelectOption);
  }, [searchQuery]);

  const handleChange = useCallback(
    (option: Option | Option[]) => {
      if (!option || Array.isArray(option)) {
        setValue("");
        return;
      }
      const slug = String(option.value);
      if (isSimpleIconSlug(slug)) {
        setValue(slug);
      }
    },
    [setValue],
  );

  const fieldLabel = typeof field.label === "string" ? field.label : "Icon";

  return (
    <div className={fieldBaseClass}>
      <FieldLabel label={fieldLabel} path={path} />

      <ReactSelect
        isClearable
        isSearchable
        onChange={handleChange}
        onInputChange={(val) => setSearchQuery(val)}
        options={options}
        placeholder="Search brands or frameworks"
        value={selectedOption}
      />

      <FieldDescription
        description='Search the Simple Icons catalog and select an icon like "gin" or "postgresql".'
        path={path}
      />
    </div>
  );
};
