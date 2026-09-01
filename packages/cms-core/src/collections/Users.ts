import type { CollectionConfig, Condition, PayloadRequest } from "payload";
import { createBasicRichTextEditor } from "@/lib/editor";
import { generateForgotPasswordEmailHTML, generateForgotPasswordEmailSubject } from "@/lib/email";
import { createPayloadDataSchemaHook, usersSchema } from "@/lib/validation";
import { linkFields } from "@/fields/link";

const showProfileFieldsAfterLogin: Condition = (_data, _siblingData, { user }) => {
  return Boolean(user);
};

const normalizePath = (path: string): string => {
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  return withLeadingSlash.replace(/\/+$/, "");
};

const joinRoutePaths = (basePath: string, childPath: string): string => {
  const normalizedBasePath = normalizePath(basePath);
  const normalizedChildPath = normalizePath(childPath);

  if (normalizedBasePath === "/") {
    return normalizedChildPath;
  }

  return `${normalizedBasePath}${normalizedChildPath}`;
};

const buildAbsoluteURL = (serverURL: string, routePath: string): string => {
  return new URL(routePath, `${serverURL.replace(/\/+$/, "")}/`).toString();
};

const getAdminURL = (req: PayloadRequest | undefined, token: string): string => {
  const adminRoute = req?.payload.config.routes?.admin || "/admin";
  const resetRoute = req?.payload.config.admin?.routes?.reset || "/reset";
  const fullPath = `${joinRoutePaths(adminRoute, resetRoute)}/${token}`;
  const serverURL = req?.payload.config.serverURL || "";

  return buildAbsoluteURL(serverURL, fullPath);
};

export const Users: CollectionConfig = {
  slug: "users",
  access: {
    create: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeValidate: [
      createPayloadDataSchemaHook(usersSchema, { errorPrefix: "Users validation failed:" }),
    ],
  },
  auth: {
    useAPIKey: true,
    forgotPassword: {
      generateEmailHTML: async (args) => {
        const req = args?.req;
        const token = args?.token;
        const userEmail = args?.user?.email;

        if (!token || !userEmail) {
          throw new Error("Missing password reset email context.");
        }

        const resetPasswordURL = getAdminURL(req, token);
        return generateForgotPasswordEmailHTML({ resetPasswordURL, userEmail });
      },
      generateEmailSubject: (args) => {
        const userEmail = args?.user?.email;

        if (!userEmail) {
          throw new Error("Missing user email for password reset email subject.");
        }

        return generateForgotPasswordEmailSubject({ userEmail });
      },
    },
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "updatedAt"],
    group: "Admin",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "bio",
      type: "richText",
      required: false,
      editor: createBasicRichTextEditor(),
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
      name: "links",
      type: "array",
      required: false,
      maxRows: 5,
      admin: {
        condition: showProfileFieldsAfterLogin,
        position: "sidebar",
        components: {
          RowLabel: "./components/admin/rowLabels/LinkRowLabel#LinkRowLabel",
        },
      },
      fields: linkFields({ variant: "icon-only" }),
    },
  ],
};
