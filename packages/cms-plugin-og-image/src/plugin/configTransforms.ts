import type { CollectionConfig, Field, GlobalConfig, GroupField, TabsField } from "payload";
import type { CollectionBeforeChangeHook } from "payload";
import type { SeoFieldMapping } from "../types";
import { proposeSeoMetaValues } from "../ui/seo/seoFieldMapping";

// ---- Social Card Preview injection ----

function injectIntoMetaGroup(metaGroup: GroupField, socialCardField: Field): GroupField {
  const fields = [...(metaGroup.fields ?? [])];
  const previewIdx = fields.findIndex((f) => "name" in f && f.name === "preview");
  if (previewIdx !== -1) {
    fields.splice(previewIdx + 1, 0, socialCardField);
  } else {
    fields.push(socialCardField);
  }
  return { ...metaGroup, fields };
}

function injectPreviewIntoFields(fields: Field[], socialCardField: Field): Field[] {
  return fields.map((field) => {
    // Handle tabbed UI: find the tabs field → iterate tabs → find meta group
    if (field.type === "tabs" && "tabs" in field) {
      const tabsField = field as TabsField;
      return {
        ...tabsField,
        tabs: tabsField.tabs.map((tab) => ({
          ...tab,
          fields: (tab.fields ?? []).map((tabField) => {
            if (tabField.type === "group" && "name" in tabField && tabField.name === "meta") {
              return injectIntoMetaGroup(tabField as GroupField, socialCardField);
            }
            return tabField;
          }),
        })),
      };
    }

    // Handle non-tabbed: direct meta group at top level
    if (field.type === "group" && "name" in field && field.name === "meta") {
      return injectIntoMetaGroup(field as GroupField, socialCardField);
    }

    return field;
  });
}

export function injectSocialCardPreview(
  collection: CollectionConfig,
  socialCardField: Field,
): CollectionConfig {
  return {
    ...collection,
    fields: injectPreviewIntoFields(collection.fields, socialCardField),
  };
}

export function injectSocialCardPreviewGlobal(
  global: GlobalConfig,
  socialCardField: Field,
): GlobalConfig {
  return {
    ...global,
    fields: injectPreviewIntoFields(global.fields, socialCardField),
  };
}

// ---- Make SEO fields required ----

function makeRequiredInMetaGroup(metaGroup: GroupField): GroupField {
  const fields = (metaGroup.fields ?? []).map((f) => {
    if ("name" in f && (f.name === "title" || f.name === "description")) {
      return { ...f, required: true };
    }
    return f;
  });
  return { ...metaGroup, fields };
}

function makeRequiredInFields(fields: Field[]): Field[] {
  return fields.map((field) => {
    if (field.type === "tabs" && "tabs" in field) {
      const tabsField = field as TabsField;
      return {
        ...tabsField,
        tabs: tabsField.tabs.map((tab) => ({
          ...tab,
          fields: (tab.fields ?? []).map((tabField) => {
            if (tabField.type === "group" && "name" in tabField && tabField.name === "meta") {
              return makeRequiredInMetaGroup(tabField as GroupField);
            }
            return tabField;
          }),
        })),
      };
    }

    if (field.type === "group" && "name" in field && field.name === "meta") {
      return makeRequiredInMetaGroup(field as GroupField);
    }

    return field;
  });
}

export function makeSeoFieldsRequired(collection: CollectionConfig): CollectionConfig {
  return { ...collection, fields: makeRequiredInFields(collection.fields) };
}

export function makeSeoFieldsRequiredGlobal(global: GlobalConfig): GlobalConfig {
  return { ...global, fields: makeRequiredInFields(global.fields) };
}

// ---- SEO-aware button injection ----

export function resolveButtonMode(
  collection: CollectionConfig,
  seoButtonsOption: false | Record<string, "draft-and-publish" | "save-only" | false> | undefined,
): "draft-and-publish" | "save-only" | false {
  if (seoButtonsOption === false) return false;

  const explicit = seoButtonsOption?.[collection.slug];
  if (explicit !== undefined) return explicit;

  // Auto-detect: versioned collections with drafts get draft-and-publish
  const versions = collection.versions;
  const hasDrafts =
    typeof versions === "object" &&
    versions !== null &&
    "drafts" in versions &&
    Boolean(versions.drafts);

  return hasDrafts ? "draft-and-publish" : "save-only";
}

export function injectSeoButtons(
  collection: CollectionConfig,
  mode: "draft-and-publish" | "save-only",
  mapping?: SeoFieldMapping | null,
): CollectionConfig {
  const clientProps = mapping ? { mapping } : undefined;

  type ComponentEntry = string | { path: string; clientProps?: Record<string, unknown> };
  const makeEntry = (path: string): ComponentEntry => (clientProps ? { path, clientProps } : path);

  const editComponents: Record<string, ComponentEntry> = {};

  if (mode === "draft-and-publish") {
    editComponents["PublishButton"] = makeEntry("@sidshub/cms-plugin-og-image/ui#SeoPublishButton");
    editComponents["SaveDraftButton"] = makeEntry(
      "@sidshub/cms-plugin-og-image/ui#SeoSaveDraftButton",
    );
  } else {
    editComponents["SaveButton"] = makeEntry("@sidshub/cms-plugin-og-image/ui#SeoSaveButton");
  }

  return {
    ...collection,
    admin: {
      ...collection.admin,
      components: {
        ...(collection.admin?.components ?? {}),
        edit: {
          ...(collection.admin?.components?.edit ?? {}),
          ...editComponents,
        },
      },
    },
  };
}

// ---- Auto-population hook injection ----

function createAutoPopulationHook(mapping: SeoFieldMapping): CollectionBeforeChangeHook {
  return ({ data, operation }) => {
    if (operation !== "create" && operation !== "update") return data;
    if (!data || typeof data !== "object") return data;
    if (!("meta" in data) || typeof data.meta !== "object" || data.meta === null) return data;

    const meta = data.meta as Record<string, unknown>;

    // Only auto-populate when ALL meta fields are empty (first save).
    // Client-side SEO buttons handle the case where meta already has values.
    if (!meta.title && !meta.description && !meta.image) {
      const proposed = proposeSeoMetaValues(data as Record<string, unknown>, mapping);
      meta.title = proposed.title;
      meta.description = proposed.description;
      if (proposed.image) {
        meta.image = proposed.image;
      }
    }

    return data;
  };
}

export function injectAutoPopulationHook(
  collection: CollectionConfig,
  mapping: SeoFieldMapping,
): CollectionConfig {
  const hook = createAutoPopulationHook(mapping);
  return {
    ...collection,
    hooks: {
      ...collection.hooks,
      beforeChange: [...(collection.hooks?.beforeChange ?? []), hook],
    },
  };
}
