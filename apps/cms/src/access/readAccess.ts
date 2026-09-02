import type { Access } from "payload";

export const isAdminUser = (user: { role?: "admin" | "web-build" } | null | undefined): boolean =>
  user?.role !== "web-build";

export const adminAccess: Access = ({ req }) => Boolean(req.user && isAdminUser(req.user));

export const publishedReadAccess: Access = ({ req }) =>
  req.user && isAdminUser(req.user) ? true : { _status: { equals: "published" } };

export const publicReadAccess: Access = () => true;
