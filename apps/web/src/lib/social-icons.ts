import type { SiteFooterItemType } from "@sidshub/cms-config/client-core";
import {
  PhGithubLogo,
  PhLinkedinLogo,
  PhXLogo,
  PhFacebookLogo,
  PhInstagramLogo,
  PhDribbbleLogo,
  PhEnvelope,
  PhRss,
  PhYoutubeLogo,
  PhTwitchLogo,
  PhTiktokLogo,
  PhMediumLogo,
  PhWhatsappLogo,
  PhTelegramLogo,
  PhDiscordLogo,
  PhRedditLogo,
  PhPinterestLogo,
  PhBehanceLogo,
  PhCodepenLogo,
  PhGitlabLogo,
  PhStackOverflowLogo,
  PhDevToLogo,
} from "phosphor-icons-astro";

const ICONS_BY_TYPE: Record<SiteFooterItemType, typeof PhGithubLogo> = {
  github: PhGithubLogo,
  linkedin: PhLinkedinLogo,
  email: PhEnvelope,
  rss: PhRss,
  facebook: PhFacebookLogo,
  twitter: PhXLogo,
  dribbble: PhDribbbleLogo,
  instagram: PhInstagramLogo,
  youtube: PhYoutubeLogo,
  twitch: PhTwitchLogo,
  tiktok: PhTiktokLogo,
  medium: PhMediumLogo,
  whatsapp: PhWhatsappLogo,
  telegram: PhTelegramLogo,
  discord: PhDiscordLogo,
  reddit: PhRedditLogo,
  pinterest: PhPinterestLogo,
  behance: PhBehanceLogo,
  codepen: PhCodepenLogo,
  gitlab: PhGitlabLogo,
  stackoverflow: PhStackOverflowLogo,
  devto: PhDevToLogo,
};

export const getIconForType = (type: SiteFooterItemType) => {
  return ICONS_BY_TYPE[type];
};
