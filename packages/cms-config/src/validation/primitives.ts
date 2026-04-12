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

export const requiredText = z.preprocess(trimPreprocess, z.string().min(1, "This field is required."));

export const optionalText = z.preprocess(optionalTrimmedPreprocess, z.string().min(1).optional());

export const optionalTextWithFallback = (fallback: string) => {
  return z.preprocess((value: unknown) => {
    if (typeof value !== "string") {
      return fallback;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }, z.string().min(1));
};

export const requiredHttpUrl = z
  .preprocess(trimPreprocess, z.string().url("Enter a valid URL."))
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "URL must start with http:// or https://.");

export const optionalHttpUrl = z
  .preprocess(optionalTrimmedPreprocess, z.string().url("Enter a valid URL.").optional())
  .refine((value) => {
    if (!value) {
      return true;
    }

    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "URL must start with http:// or https://.");

export const optionalSlugLikeText = z.preprocess(optionalTrimmedPreprocess, z.string().optional());
