import type { Access } from "payload";

import { getReadAccessToken } from "./readAccessConfig";

const extractAuthorizationHeader = (headers: unknown): string | undefined => {
  if (!headers) {
    return undefined;
  }

  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    return headers.get("authorization") || undefined;
  }

  if (typeof headers === "object") {
    const record = headers as Record<string, unknown>;
    const direct = record.authorization;
    if (typeof direct === "string") {
      return direct;
    }

    const lower = record.Authorization;
    if (typeof lower === "string") {
      return lower;
    }
  }

  return undefined;
};

const getBearerToken = (authorization: string | undefined): string | undefined => {
  if (!authorization) {
    return undefined;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }

  return token.trim() || undefined;
};

export const readAccess: Access = ({ req }) => {
  if (req.user) {
    return true;
  }

  const expectedToken = getReadAccessToken();
  if (!expectedToken || !expectedToken.trim()) {
    return false;
  }

  const authorization = extractAuthorizationHeader((req as { headers?: unknown }).headers);
  const providedToken = getBearerToken(authorization);

  return providedToken === expectedToken;
};
