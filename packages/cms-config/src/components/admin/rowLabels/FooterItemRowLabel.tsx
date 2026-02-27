"use client";

import { useRowLabel } from "@payloadcms/ui";

import { formatRowLabel, getTrimmedString } from "./utils";

type FooterItemRowData = {
  type?: unknown;
};

const TYPE_LABELS: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  email: "Email",
  rss: "RSS",
  facebook: "Facebook",
  twitter: "Twitter",
  dribbble: "Dribbble",
  instagram: "Instagram",
  youtube: "YouTube",
  twitch: "Twitch",
  tiktok: "TikTok",
  medium: "Medium",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  discord: "Discord",
  reddit: "Reddit",
  pinterest: "Pinterest",
  behance: "Behance",
  codepen: "CodePen",
  gitlab: "GitLab",
  stackoverflow: "Stack Overflow",
  devto: "dev.to",
};

export function FooterItemRowLabel() {
  const { data, rowNumber } = useRowLabel<FooterItemRowData>();
  const type = getTrimmedString(data?.type);
  const label = type ? (TYPE_LABELS[type] ?? type) : undefined;

  return formatRowLabel({
    label,
    noun: "Link",
    rowNumber,
  });
}
