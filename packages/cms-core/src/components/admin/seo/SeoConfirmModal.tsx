"use client";

import { Drawer, useDrawerSlug } from "@payloadcms/ui";

const FIELD_LABELS: Record<"title" | "description" | "image", string> = {
  title: "Title",
  description: "Description",
  image: "Image",
};

type SeoConfirmModalProps = {
  /** Drawer slug (unique per call site, used with Payload's Drawer system) */
  slug: string;
  /** Which fields have differences — these are shown as a list in the dialog */
  changedFields: Array<"title" | "description" | "image">;
  /** Called when user clicks "Update SEO" */
  onConfirm: () => void;
  /** Called when user clicks "Skip" */
  onSkip: () => void;
};

export function SeoConfirmModal({ slug, changedFields, onConfirm, onSkip }: SeoConfirmModalProps) {
  const drawerSlug = useDrawerSlug(slug);

  return (
    <Drawer slug={drawerSlug} title="Update SEO metadata?">
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          color: "var(--theme-text)",
        }}
      >
        <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "var(--theme-text)" }}>
          The following fields will be updated to match your content:
        </p>

        <ul
          style={{
            margin: 0,
            paddingLeft: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {changedFields.map((field) => (
            <li key={field} style={{ fontSize: "14px", color: "var(--theme-text)" }}>
              {FIELD_LABELS[field]}
            </li>
          ))}
        </ul>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          <button
            type="button"
            onClick={onSkip}
            style={{
              padding: "8px 16px",
              background: "transparent",
              color: "var(--theme-text)",
              border: "1px solid var(--theme-elevation-200)",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Skip
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              background: "var(--theme-text)",
              color: "var(--theme-bg)",
              border: "none",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Update SEO
          </button>
        </div>
      </div>
    </Drawer>
  );
}
