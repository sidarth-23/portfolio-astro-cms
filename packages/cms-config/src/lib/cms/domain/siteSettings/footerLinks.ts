import { z } from "zod";

import {
  FOOTER_ITEM_KIND,
  FOOTER_ITEM_KIND_CONFIG,
  SITE_FOOTER_ITEM_TYPES,
} from "../../../options/footerItems";
import type { SiteFooterItemType } from "../types";

type FooterLinkRule = {
  openInNewTab: boolean;
  normalize: (rawValue: string) => string | undefined;
  inputLabel: string;
  inputDescription: string;
  hideInput: boolean;
};

const FOOTER_TYPE_SET = new Set<string>(SITE_FOOTER_ITEM_TYPES);

const TYPE_ALIASES: Record<string, SiteFooterItemType> = {
  "stack overflow": "stackoverflow",
  "dev.to": "devto",
};

const emailValueSchema = z.string().trim().toLowerCase().min(1, "Enter an email address.").email(
  "Enter a valid email address, for example name@example.com.",
);

const absoluteHttpUrlSchema = z
  .string()
  .trim()
  .min(1, "Enter a URL.")
  .url("Enter a valid URL that starts with https:// or http://.")
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "Enter a valid URL that starts with https:// or http://.");

const normalizeEmail = (value: string): string | undefined => {
  const parsed = emailValueSchema.safeParse(value);
  if (!parsed.success) {
    return undefined;
  }

  return `mailto:${parsed.data}`;
};

const normalizeAbsoluteUrl = (value: string): string | undefined => {
  const parsed = absoluteHttpUrlSchema.safeParse(value);
  if (!parsed.success) {
    return undefined;
  }

  return parsed.data;
};

const RULE_BY_KIND: Record<"url" | "email" | "rss", FooterLinkRule> = {
  url: {
    ...FOOTER_ITEM_KIND_CONFIG.url,
    normalize: normalizeAbsoluteUrl,
  },
  email: {
    ...FOOTER_ITEM_KIND_CONFIG.email,
    normalize: normalizeEmail,
  },
  rss: {
    ...FOOTER_ITEM_KIND_CONFIG.rss,
    normalize: () => "/rss.xml",
  },
};

const FOOTER_LINK_RULES: Record<SiteFooterItemType, FooterLinkRule> = Object.fromEntries(
  SITE_FOOTER_ITEM_TYPES.map((type) => [type, RULE_BY_KIND[FOOTER_ITEM_KIND[type] ?? "url"]]),
) as Record<SiteFooterItemType, FooterLinkRule>;

export const normalizeFooterItemType = (value: unknown): SiteFooterItemType | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const lower = trimmed.toLowerCase();
  const aliased = TYPE_ALIASES[lower];
  if (aliased) {
    return aliased;
  }

  return FOOTER_TYPE_SET.has(lower) ? (lower as SiteFooterItemType) : undefined;
};

export const isFooterItemType = (value: unknown): value is SiteFooterItemType => {
  return typeof value === "string" && FOOTER_TYPE_SET.has(value);
};

export const getFooterLinkRule = (type: SiteFooterItemType): FooterLinkRule => {
  return FOOTER_LINK_RULES[type];
};

type FooterItemCandidate = {
  type?: unknown;
  url?: unknown;
  email?: unknown;
  id?: string | null;
};

export type SanitizedFooterItem = {
  type: SiteFooterItemType;
  url: string;
  email?: string;
  id?: string | null;
};

const footerItemCandidateSchema = z.object({
  type: z.unknown(),
  url: z.unknown().optional(),
  email: z.unknown().optional(),
  id: z.union([z.string(), z.null()]).optional(),
});

const toFooterItemCandidate = (value: unknown): FooterItemCandidate => {
  const parsed = footerItemCandidateSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
};

export const validateAndSanitizeFooterItem = (
  value: unknown,
):
  | {
      success: true;
      data: SanitizedFooterItem;
    }
  | {
      success: false;
      error: string;
    } => {
  const candidate = toFooterItemCandidate(value);
  const type = normalizeFooterItemType(candidate.type);
  if (!type) {
    return {
      success: false,
      error: "Select a valid link type.",
    };
  }

  const kind = FOOTER_ITEM_KIND[type] ?? "url";

  if (kind === "rss") {
    return {
      success: true,
      data: {
        type,
        url: "/rss.xml",
        id: candidate.id,
      },
    };
  }

  if (kind === "email") {
    const parsedEmail = emailValueSchema.safeParse(typeof candidate.email === "string" ? candidate.email : "");
    if (!parsedEmail.success) {
      return {
        success: false,
        error: parsedEmail.error.issues[0]?.message || "Enter a valid email address, for example name@example.com.",
      };
    }

    return {
      success: true,
      data: {
        type,
        email: parsedEmail.data,
        url: `mailto:${parsedEmail.data}`,
        id: candidate.id,
      },
    };
  }

  const parsedUrl = absoluteHttpUrlSchema.safeParse(typeof candidate.url === "string" ? candidate.url : "");
  if (!parsedUrl.success) {
    return {
      success: false,
      error: parsedUrl.error.issues[0]?.message || "Enter a valid URL that starts with https:// or http://.",
    };
  }

  return {
    success: true,
    data: {
      type,
      url: parsedUrl.data,
      id: candidate.id,
    },
  };
};
