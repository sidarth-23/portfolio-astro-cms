import type {
  CvPage,
  HomePage,
  Post,
  Project,
  Series,
  SiteSetting,
  User,
} from "@sidshub/cms/payload-types";
import { resolveIconSvg } from "@sidshub/icon-catalog";
import {
  asCategory,
  asPopulatedAuthors,
  asSeries,
  asUserArray,
  isRelationID,
  type PopulatedAuthor,
  type RelationID,
} from "./relations";
import type { ResolvedLink } from "@/lib/types";
import type { HomeCtaButton, TagInfo, CategoryInfo, SeriesInfo } from "./types";

export const createSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/^-+|-+$/g, "");
type PageRoute = "home" | "blog" | "projects" | "cv" | "rss";
export const PAGE_ROUTE_MAP: Record<PageRoute, string> = {
  home: "/",
  blog: "/blog",
  projects: "/projects",
  cv: "/cv",
  rss: "/rss.xml",
};

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};
const isPost = (value: RelationID | Post | null | undefined): value is Post =>
  typeof value === "object" && value !== null && value._status !== "draft";
const isProject = (value: RelationID | Project | null | undefined): value is Project =>
  typeof value === "object" && value !== null && value._status !== "draft";
const isSeries = (value: RelationID | Series | null | undefined): value is Series =>
  typeof value === "object" && value !== null;

type LinkReference =
  | { relationTo: string; value: RelationID | Post | Project | Series | null | undefined }
  | RelationID
  | null
  | undefined;
type LinkShape = {
  type?: string | null;
  url?: string | null;
  page?: string | null;
  reference?: LinkReference;
  newTab?: boolean | null;
};
type CvSection = CvPage["sections"][number];
type CvItem = NonNullable<CvSection["items"]>[number];
export type ResolvedCvBadgeGroup = {
  title: string;
  badges: Array<{ value: string; iconData: ReturnType<typeof resolveIconSvg> }>;
};

const resolveReferenceUrl = (reference: LinkReference): string | undefined => {
  if (!reference || isRelationID(reference)) return undefined;
  const value = reference.value;
  if (!value || isRelationID(value)) return undefined;
  if (reference.relationTo === "posts" && isPost(value) && value.slug) return `/blog/${value.slug}`;
  if (reference.relationTo === "projects" && isProject(value) && value.slug)
    return `/projects/${value.slug}`;
  if (reference.relationTo === "series" && isSeries(value) && value.slug)
    return `/blog/series/${value.slug}`;
  return undefined;
};

export const resolveLinkUrl = (
  link: LinkShape | null | undefined,
  siteUrl?: string,
): string | undefined => {
  if (!link) return undefined;
  const type = link.type ?? "custom";
  if (type === "custom") return toTrimmedString(link.url);
  if (type === "reference") return resolveReferenceUrl(link.reference);
  if (type !== "page") return undefined;
  const page = toTrimmedString(link.page);
  const route = page ? PAGE_ROUTE_MAP[page as keyof typeof PAGE_ROUTE_MAP] : undefined;
  if (!route) return undefined;
  if (!siteUrl) return route;
  try {
    return new URL(route, siteUrl).toString();
  } catch {
    return route;
  }
};

export const homeCtaButtons = (homePage: HomePage, siteUrl?: string): HomeCtaButton[] =>
  homePage.ctaButtons?.flatMap((button) => {
    const title = toTrimmedString(button.title);
    const href = resolveLinkUrl(button.link, siteUrl);
    return title && href
      ? [
          {
            title,
            href,
            variant: button.variant ?? "default",
            newTab: button.link?.newTab === true,
          },
        ]
      : [];
  }) ?? [];
export const featuredPostsFromHomeSection = (
  section: NonNullable<HomePage["featuredSections"]>[number],
): Post[] => (Array.isArray(section.posts) ? section.posts.filter(isPost) : []);
export const featuredProjectsFromHomeSection = (
  section: NonNullable<HomePage["featuredSections"]>[number],
): Project[] => (Array.isArray(section.projects) ? section.projects.filter(isProject) : []);
export const categoryFromPost = (post: Post): CategoryInfo | undefined => {
  const category = asCategory(post.primaryCategory);
  return category ? { name: category.name, slug: category.slug } : undefined;
};
export const tagsFromPost = (post: Post): TagInfo[] =>
  Array.isArray(post.tags)
    ? post.tags.flatMap((tag) => {
        const value = toTrimmedString(tag?.value);
        return value ? [{ name: value, slug: createSlug(value) }] : [];
      })
    : [];
export const seriesFromPost = (post: Post): SeriesInfo | undefined => {
  const series = asSeries(post.series);
  return series ? { name: series.name, slug: series.slug } : undefined;
};
export const badgesFromProject = (project: Project): string[] =>
  Array.isArray(project.badges)
    ? project.badges.flatMap((badge) => {
        const value = toTrimmedString(badge?.value);
        return value ? [value] : [];
      })
    : [];
export const tagsFromProject = (project: Project): TagInfo[] =>
  Array.isArray(project.tags)
    ? project.tags.flatMap((tag) => {
        const value = toTrimmedString(tag?.value);
        return value ? [{ name: value, slug: createSlug(value) }] : [];
      })
    : [];
export const linksFromProject = (project: Project, siteUrl?: string): ResolvedLink[] =>
  Array.isArray(project.links)
    ? project.links.flatMap((link) => {
        const icon = toTrimmedString(link.icon as string | undefined);
        const url = resolveLinkUrl(link, siteUrl);
        const iconData = icon ? resolveIconSvg(icon) : null;
        return icon && url && iconData ? [{ url, newTab: link.newTab === true, ...iconData }] : [];
      })
    : [];
export const footerItemsFromSiteSettings = (
  settings: SiteSetting,
  siteUrl?: string,
): ResolvedLink[] =>
  Array.isArray(settings.sidebarFooterItems)
    ? settings.sidebarFooterItems.flatMap((item) => {
        const icon = toTrimmedString(item?.icon);
        const url = resolveLinkUrl(item, siteUrl);
        const iconData = icon ? resolveIconSvg(icon) : null;
        return icon && url && iconData ? [{ url, newTab: item?.newTab === true, ...iconData }] : [];
      })
    : [];
export const authorsFromPost = (post: Post): Array<PopulatedAuthor | User> => {
  const populated = asPopulatedAuthors(post.populatedAuthors);
  return populated.length > 0 ? populated : asUserArray(post.authors);
};
const formatCvMonth = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime())
    ? dateStr
    : new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
};
export const subtitleFromCvItem = (item: CvItem): string => {
  if (item.itemType === "organizationRole") {
    const start = formatCvMonth(item.startMonth);
    const end = item.currentlyWorkingHere ? "Current" : formatCvMonth(item.endMonth);
    return [[start, end].filter(Boolean).join(" - "), item.organization, item.location]
      .filter(Boolean)
      .join(" | ");
  }
  return item.itemType === "generic" || !item.itemType ? (item.subtitle ?? "") : "";
};
export const resolvedBadgeGroupsFromCvSection = (section: CvSection): ResolvedCvBadgeGroup[] =>
  (section.badgeGroups ?? []).map((group) => ({
    title: group.title,
    badges: (group.badges ?? [])
      .filter((badge) => Boolean(badge.value))
      .map((badge) => ({
        value: badge.value,
        iconData: badge.icon ? resolveIconSvg(badge.icon) : null,
      })),
  }));
