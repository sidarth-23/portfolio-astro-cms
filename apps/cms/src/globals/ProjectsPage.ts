import type { GlobalConfig } from "payload";
import { createBasicRichTextEditor } from "@cms/lib/editor";

import { publicReadAccess } from "@cms/access/readAccess";
import { createPayloadDataSchemaHook, projectsPageSchema } from "@cms/lib/validation";

type ProjectRelationValue = number | string | { id?: number | string | null } | null | undefined;

const toProjectID = (value: ProjectRelationValue): number | string | undefined => {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const id = value.id;
    if (typeof id === "number" || typeof id === "string") {
      return id;
    }
  }

  return undefined;
};

const getUniqueProjectIDs = (values: unknown): Array<number | string> => {
  if (!Array.isArray(values)) {
    return [];
  }

  const ids = values
    .map((value) => toProjectID(value as ProjectRelationValue))
    .filter((id): id is number | string => id !== undefined);

  return [...new Set(ids)];
};

const getSelectedProjectIDs = (data: unknown): Array<number | string> => {
  if (!data || typeof data !== "object") {
    return [];
  }

  const sections = (data as { sections?: unknown }).sections;
  if (!Array.isArray(sections)) {
    return [];
  }

  const ids = sections.flatMap((section) => {
    if (!section || typeof section !== "object") {
      return [];
    }

    return getUniqueProjectIDs((section as { projects?: unknown }).projects);
  });

  return [...new Set(ids)];
};

export const ProjectsPage: GlobalConfig = {
  slug: "projects-page",
  label: "Projects Page",
  access: {
    read: publicReadAccess,
  },
  admin: {
    group: "Pages",
  },
  hooks: {
    beforeValidate: [
      createPayloadDataSchemaHook(projectsPageSchema, {
        errorPrefix: "Projects page validation failed:",
      }),
    ],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Content",
          fields: [
            {
              name: "sections",
              type: "array",
              required: true,
              minRows: 1,
              admin: {
                components: {
                  RowLabel: "./components/admin/rowLabels/SectionRowLabel#SectionRowLabel",
                },
              },
              fields: [
                {
                  name: "title",
                  type: "text",
                  required: true,
                },
                {
                  name: "description",
                  type: "richText",
                  editor: createBasicRichTextEditor(),
                },
                {
                  name: "projects",
                  type: "relationship",
                  relationTo: "projects",
                  hasMany: true,
                  required: true,
                  minRows: 1,
                  filterOptions: ({ data, siblingData }) => {
                    const selectedIDs = getSelectedProjectIDs(data);
                    const currentSectionIDs = new Set(
                      getUniqueProjectIDs((siblingData as { projects?: unknown } | null)?.projects),
                    );
                    const excludedIDs = selectedIDs.filter((id) => !currentSectionIDs.has(id));

                    if (excludedIDs.length === 0) {
                      return true;
                    }

                    return {
                      id: {
                        not_in: excludedIDs,
                      },
                    };
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
