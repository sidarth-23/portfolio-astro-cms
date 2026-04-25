"use client";

import type { ReactElement } from "react";
import {
  Button,
  Drawer,
  DrawerContentContainer,
  FieldDescription,
  FieldLabel,
  SelectInput,
  TextareaInput,
  fieldBaseClass,
} from "@payloadcms/ui";

import type { UseFootnoteControllerValue } from "./useFootnoteController";

type FootnoteModalProps = {
  controller: UseFootnoteControllerValue;
  drawerSlug: string;
};

export function FootnoteModal({ controller, drawerSlug }: FootnoteModalProps): ReactElement {
  const {
    available,
    error,
    handleCancel,
    handleSubmit,
    mode,
    selectedId,
    setMode,
    setSelectedId,
    setText,
    text,
  } = controller;

  const modeOptions = [
    { label: "New footnote", value: "new" },
    { label: "Reuse existing", value: "reuse" },
  ];

  const existingOptions =
    available.length === 0
      ? [{ label: "No footnotes available", value: "" }]
      : available.map((item) => {
          return {
            label: `[${item.id}] ${item.preview}`,
            value: item.id,
          };
        });

  return (
    <Drawer slug={drawerSlug} title="Insert Footnote">
      <DrawerContentContainer>
        <div style={{ display: "grid", gap: "0.8rem" }}>
          <div className={fieldBaseClass}>
            <FieldDescription
              path={`${drawerSlug}.description`}
              description="Create a new footnote or reuse an existing one. After inserting, edit the definition's rich text directly in the content editor above."
            />
          </div>

          <SelectInput
            label="Mode"
            name={`${drawerSlug}.mode`}
            options={modeOptions}
            path={`${drawerSlug}.mode`}
            value={mode}
            onChange={(value) => {
              const nextMode = Array.isArray(value) ? value[0]?.value : value?.value;
              if (nextMode === "reuse") {
                setMode("reuse");
                return;
              }

              setMode("new");
            }}
          />

          {mode === "new" ? (
            <TextareaInput
              label="Initial footnote text (optional)"
              path={`${drawerSlug}.text`}
              placeholder="Leave blank to start with an empty footnote…"
              rows={3}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
              }}
            />
          ) : (
            <SelectInput
              label="Existing footnote"
              name={`${drawerSlug}.existing`}
              options={existingOptions}
              path={`${drawerSlug}.existing`}
              readOnly={available.length === 0}
              value={selectedId}
              onChange={(value) => {
                const selectedValue = Array.isArray(value) ? value[0]?.value : value?.value;
                setSelectedId(typeof selectedValue === "string" ? selectedValue : "");
              }}
            />
          )}

          {error && (
            <div className={fieldBaseClass}>
              <FieldLabel label="Validation" />
              <p style={{ color: "var(--theme-error-500)", margin: "0.25rem 0 0" }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <Button buttonStyle="secondary" onClick={handleCancel} type="button">
              Cancel
            </Button>
            <Button buttonStyle="primary" onClick={handleSubmit} type="button">
              Insert
            </Button>
          </div>
        </div>
      </DrawerContentContainer>
    </Drawer>
  );
}
