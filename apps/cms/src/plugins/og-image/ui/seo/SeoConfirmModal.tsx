"use client";

import { ConfirmationModal } from "@payloadcms/ui";

const FIELD_LABELS: Record<"title" | "description" | "image", string> = {
  title: "Title",
  description: "Description",
  image: "Image",
};

type SeoConfirmModalProps = {
  /**
   * The already-formatted drawer slug from `useDrawerSlug()` in the parent.
   * The parent is responsible for computing this via `useDrawerSlug(baseSlug)` to
   * ensure the slug matches the one passed to `openModal()`.
   */
  slug: string;
  /** Which fields have differences — these are shown as a list in the dialog */
  changedFields: Array<"title" | "description" | "image">;
  /** Called when user clicks "Update SEO". Caller is responsible for closing the drawer via closeModal(). */
  onConfirm: () => void;
  /** Called when user clicks "Skip". Caller is responsible for closing the drawer via closeModal(). */
  onSkip: () => void;
};

export function SeoConfirmModal({ slug, changedFields, onConfirm, onSkip }: SeoConfirmModalProps) {
  const body = (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <p style={{ margin: 0 }}>The following fields will be updated to match your content:</p>
      {changedFields.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: "1rem" }}>
          {changedFields.map((field) => (
            <li key={field}>{FIELD_LABELS[field]}</li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <ConfirmationModal
      body={body}
      cancelLabel="Skip"
      confirmLabel="Update SEO"
      heading="Update SEO metadata?"
      modalSlug={slug}
      onCancel={onSkip}
      onConfirm={onConfirm}
    />
  );
}
