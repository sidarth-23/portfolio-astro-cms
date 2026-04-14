import type { CollectionSlug, Field, RichTextAdapterProvider } from "payload";

type FeaturedSectionFieldsArgs = {
  relationTo?: CollectionSlug[];
  descriptionEditor?: RichTextAdapterProvider;
};

export const featuredSectionFields = ({
  relationTo = ["posts", "projects"],
  descriptionEditor,
}: FeaturedSectionFieldsArgs = {}): Field[] => {
  const collectionOptions = relationTo.map((slug) => ({
    label: slug.charAt(0).toUpperCase() + slug.slice(1),
    value: slug,
  }));

  const itemFields: Field[] = relationTo.map((slug) => ({
    name: slug,
    type: "relationship",
    relationTo: slug,
    hasMany: true,
    required: false,
    admin: {
      condition: (_: Record<string, unknown>, siblingData: Record<string, unknown>) =>
        siblingData?.sourceCollection === slug,
    },
  }));

  return [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "richText",
      required: false,
      ...(descriptionEditor ? { editor: descriptionEditor } : {}),
    },
    {
      name: "sourceCollection",
      type: "select",
      required: true,
      defaultValue: relationTo[0],
      options: collectionOptions,
    },
    ...itemFields,
  ];
};
