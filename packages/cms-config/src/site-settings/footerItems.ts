export const SITE_FOOTER_ITEM_OPTIONS = [
  { label: "GitHub", value: "github" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "Email", value: "email" },
  { label: "RSS", value: "rss" },
  { label: "Facebook", value: "facebook" },
  { label: "Twitter", value: "twitter" },
  { label: "Dribbble", value: "dribbble" },
  { label: "Instagram", value: "instagram" },
  { label: "YouTube", value: "youtube" },
  { label: "Twitch", value: "twitch" },
  { label: "TikTok", value: "tiktok" },
  { label: "Medium", value: "medium" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Telegram", value: "telegram" },
  { label: "Discord", value: "discord" },
  { label: "Reddit", value: "reddit" },
  { label: "Pinterest", value: "pinterest" },
  { label: "Behance", value: "behance" },
  { label: "CodePen", value: "codepen" },
  { label: "GitLab", value: "gitlab" },
  { label: "Stack Overflow", value: "stackoverflow" },
  { label: "dev.to", value: "devto" },
] as const;

export type SiteFooterItemOption = (typeof SITE_FOOTER_ITEM_OPTIONS)[number];
export type SiteFooterItemValue = SiteFooterItemOption["value"];
export type FooterItemKind = "url" | "email" | "rss";
export type FooterItemKindConfig = {
  inputLabel: string;
  inputDescription: string;
  hideInput: boolean;
  openInNewTab: boolean;
};

export const SITE_FOOTER_ITEM_TYPES = SITE_FOOTER_ITEM_OPTIONS.map((option) => option.value) as SiteFooterItemValue[];

export const SITE_FOOTER_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SITE_FOOTER_ITEM_OPTIONS.map((option) => [option.value, option.label]),
);

const URL_FOOTER_TYPES = SITE_FOOTER_ITEM_TYPES.filter((type) => type !== "email" && type !== "rss") as Exclude<
  SiteFooterItemValue,
  "email" | "rss"
>[];

export const FOOTER_ITEM_KIND: Record<SiteFooterItemValue, FooterItemKind> = {
  ...Object.fromEntries(URL_FOOTER_TYPES.map((type) => [type, "url"])),
  email: "email",
  rss: "rss",
} as Record<SiteFooterItemValue, FooterItemKind>;

export const FOOTER_ITEM_KIND_CONFIG: Record<FooterItemKind, FooterItemKindConfig> = {
  url: {
    inputLabel: "URL",
    inputDescription: "Enter a full URL including https://",
    hideInput: false,
    openInNewTab: true,
  },
  email: {
    inputLabel: "Email",
    inputDescription: "Enter an email address, for example name@example.com",
    hideInput: false,
    openInNewTab: false,
  },
  rss: {
    inputLabel: "RSS URL",
    inputDescription: "RSS is fixed to /rss.xml",
    hideInput: true,
    openInNewTab: false,
  },
};
