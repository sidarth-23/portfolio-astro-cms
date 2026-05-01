import { z } from "zod";

const trimPreprocess = (value: unknown): unknown => {
  return typeof value === "string" ? value.trim() : value;
};

const optionalTrimmedPreprocess = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const requiredText = z.preprocess(
  trimPreprocess,
  z.string().min(1, "This field is required."),
);

export const optionalText = z.preprocess(optionalTrimmedPreprocess, z.string().min(1).optional());

const parseURL = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

export const requiredHttpUrl = z
  .preprocess(trimPreprocess, z.string().url("Enter a valid URL."))
  .refine((value) => {
    const parsed = parseURL(value);
    if (!parsed) {
      return false;
    }

    const protocol = parsed.protocol;
    return protocol === "http:" || protocol === "https:";
  }, "URL must start with http:// or https://.");

export const optionalHttpUrl = z
  .preprocess(optionalTrimmedPreprocess, z.string().url("Enter a valid URL.").optional())
  .refine((value) => {
    if (!value) {
      return true;
    }

    const parsed = parseURL(value);
    if (!parsed) {
      return false;
    }

    const protocol = parsed.protocol;
    return protocol === "http:" || protocol === "https:";
  }, "URL must start with http:// or https://.");

export const optionalSlugLikeText = z.preprocess(optionalTrimmedPreprocess, z.string().optional());

const hasInternalPathPrefix = (value: string): boolean => {
  return value.startsWith("/");
};

const isSupportedAbsoluteLinkProtocol = (value: string): boolean => {
  const parsed = parseURL(value);
  if (!parsed) {
    return false;
  }

  const protocol = parsed.protocol;
  return (
    protocol === "http:" || protocol === "https:" || protocol === "mailto:" || protocol === "tel:"
  );
};

const isSupportedLinkValue = (value: string): boolean => {
  return hasInternalPathPrefix(value) || isSupportedAbsoluteLinkProtocol(value);
};

export const optionalLinkUrl = z
  .preprocess(optionalTrimmedPreprocess, z.string().optional())
  .refine((value) => {
    if (!value) {
      return true;
    }

    return isSupportedLinkValue(value);
  }, "Enter a valid link. Use http(s), mailto, tel, or a root-relative path (for example /rss.xml).");
