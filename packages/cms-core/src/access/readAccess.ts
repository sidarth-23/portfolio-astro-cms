import type { Access } from "payload";

export const publishedReadAccess: Access = ({ req }) =>
  req.user ? true : { _status: { equals: "published" } };

export const publicReadAccess: Access = () => true;
