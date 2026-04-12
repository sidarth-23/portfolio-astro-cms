import type { GlobalConfig } from "payload";
import { createBasicRichTextEditor } from "@sidshub/lexical/cms";

import { readAccess } from "../access/readAccess";
import { createPayloadDataSchemaHook } from "../lib/validation/payloadSchema";
import { projectsPageSchema } from "../lib/validation/schemas";

type ProjectRelationValue = number | string | { id?: number | string | null } | null | undefined;

type ProjectsPageFormData = {
  sections?: Array<{
    projects?: ProjectRelationValue[] | null;
  }> | null;
};

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

const getSelectedProjectIDs = (data: unknown): Array<number | string> => {
  if (!data || typeof data !== "object") {
    return [];
  }

  const sections = (data as ProjectsPageFormData).sections;
  if (!Array.isArray(sections)) {
    return [];
  }

  const ids: Array<number | string> = [];
  for (const section of sections) {
    if (!section || !Array.isArray(section.projects)) {
      continue;
    }

    for (const project of section.projects) {
      const id = toProjectID(project);
      if (id !== undefined) {
        ids.push(id);
      }
    }
  }

  return [...new Set(ids)];
};

const getSectionProjectIDs = (siblingData: unknown): Array<number | string> => {
  if (!siblingData || typeof siblingData !== "object") {
    return [];
  }

  const projects = (siblingData as { projects?: ProjectRelationValue[] | null }).projects;
  if (!Array.isArray(projects)) {
    return [];
  }

  const ids = projects
    .map((project) => toProjectID(project))
    .filter((id): id is number | string => id !== undefined);

  return [...new Set(ids)];
};

export const ProjectsPage: GlobalConfig = {
  slug: "projects-page",
  label: "Projects Page",
  access: {
    read: readAccess,
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
                    const currentSectionIDs = new Set(getSectionProjectIDs(siblingData));
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
