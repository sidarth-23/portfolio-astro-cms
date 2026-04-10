import type { SiteFooterItemType } from "./types";

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SITE_FOOTER_ITEM_TYPES: SiteFooterItemType[] = [
  "github",
  "linkedin",
  "email",
  "rss",
  "facebook",
  "twitter",
  "dribbble",
  "instagram",
  "youtube",
  "twitch",
  "tiktok",
  "medium",
  "whatsapp",
  "telegram",
  "discord",
  "reddit",
  "pinterest",
  "behance",
  "codepen",
  "gitlab",
  "stackoverflow",
  "devto",
];

type FooterLinkRule = {
  openInNewTab: boolean;
  normalize: (rawValue: string) => string | undefined;
  inputLabel: string;
  inputDescription: string;
  hideInput: boolean;
};

const normalizeEmail = (value: string): string | undefined => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || !EMAIL_PATTERN.test(trimmed)) {
    return undefined;
  }

  return `mailto:${trimmed}`;
};

const normalizeAbsoluteUrl = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed || !ABSOLUTE_URL_PATTERN.test(trimmed)) {
    return undefined;
  }

  return trimmed;
};

const FOOTER_LINK_RULES: Record<SiteFooterItemType, FooterLinkRule> = {
  github: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  linkedin: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  email: {
    openInNewTab: false,
    normalize: normalizeEmail,
    inputLabel: "Email",
    inputDescription: "Enter an email address, for example name@example.com",
    hideInput: false,
  },
  rss: {
    openInNewTab: false,
    normalize: () => "/rss.xml",
    inputLabel: "RSS URL",
    inputDescription: "RSS is fixed to /rss.xml",
    hideInput: true,
  },
  facebook: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  twitter: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  dribbble: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  instagram: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  youtube: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  twitch: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  tiktok: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  medium: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  whatsapp: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  telegram: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  discord: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  reddit: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  pinterest: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  behance: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  codepen: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  gitlab: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  stackoverflow: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
  devto: {
    openInNewTab: true,
    normalize: normalizeAbsoluteUrl,
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
  },
};

export const normalizeFooterItemType = (value: unknown): SiteFooterItemType | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase().replace(/[\s.]+/g, "");
  if (!normalized) {
    return undefined;
  }

  return SITE_FOOTER_ITEM_TYPES.find((type) => type === normalized);
};

export const getFooterLinkRule = (type: SiteFooterItemType): FooterLinkRule => {
  return FOOTER_LINK_RULES[type];
};

export const resolveFooterLink = (
  type: SiteFooterItemType,
  rawValue: string,
): { url: string; openInNewTab: boolean } | undefined => {
  const rule = getFooterLinkRule(type);
  const url = rule.normalize(rawValue);
  if (!url) {
    return undefined;
  }

  return {
    url,
    openInNewTab: rule.openInNewTab,
  };
};
