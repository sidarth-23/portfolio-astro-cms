import type { CollectionConfig, Condition, PayloadRequest } from "payload";
import { createBasicRichTextEditor } from "@sidshub/lexical/cms";

import {
  generateForgotPasswordEmailHTML,
  generateForgotPasswordEmailSubject,
} from "../lib/email/authEmailTemplates";
import { createPayloadDataSchemaHook } from "../lib/validation/payloadSchema";
import { usersSchema } from "../lib/validation/schemas";

const showProfileFieldsAfterLogin: Condition = (
  _data,
  _siblingData,
  { user },
) => {
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

const getAdminURL = (
  req: PayloadRequest | undefined,
  token: string,
): string => {
  const adminRoute = req?.payload.config.routes?.admin || "/admin";
  const resetRoute =
    req?.payload.config.admin?.routes?.reset || "/reset";
  const fullPath = `${joinRoutePaths(adminRoute, resetRoute)}/${token}`;
  const serverURL =
    req?.payload.config.serverURL ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    "";

  return buildAbsoluteURL(serverURL, fullPath);
};

export const Users: CollectionConfig = {
  slug: "users",
  access: {
    create: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeValidate: [createPayloadDataSchemaHook(usersSchema, { errorPrefix: "Users validation failed:" })],
  },
  auth: {
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
          throw new Error(
            "Missing user email for password reset email subject.",
          );
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
