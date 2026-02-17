import type { CollectionConfig, Condition } from "payload";

const nameRequiredAfterLogin = (
  value: null | string | undefined,
  {
    operation,
    req,
  }: {
    operation?: "create" | "delete" | "read" | "update";
    req: { user?: unknown };
  },
) => {
  const isAuthenticatedUpdate = operation === "update" && Boolean(req.user);

  if (!isAuthenticatedUpdate) {
    return true;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return true;
  }

  return "Name is required after account creation.";
};

const showProfileFieldsAfterLogin: Condition = (_data, _siblingData, { user }) => {
  return Boolean(user);
};

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "updatedAt"],
    group: "Admin",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true
    },
    {
      name: "bio",
      type: "richText",
      required: false,
      admin: {
        condition: showProfileFieldsAfterLogin,
      },
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      required: false,
      admin: {
        condition: showProfileFieldsAfterLogin,
      },
    },
    {
      name: "linkedInUrl",
      type: "text",
      required: false,
      admin: {
        condition: showProfileFieldsAfterLogin,
        position: "sidebar",
      },
    },
    {
      name: "githubUrl",
      type: "text",
      required: false,
      admin: {
        condition: showProfileFieldsAfterLogin,
        position: "sidebar",
      },
    },
  ],
};
