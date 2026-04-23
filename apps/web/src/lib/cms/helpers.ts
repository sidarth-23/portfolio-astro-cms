import type {
  HomePage,
  Post,
  Project,
  Series,
  SiteSetting,
  User,
} from "@sidshub/cms-core/payload-types";
import type { CmsTransport } from "@sidshub/cms-core/client";
import { asCategory, asPopulatedAuthors, asSeries, asUserArray } from "@sidshub/cms-core/client";
import type { PopulatedAuthor, ProjectLink, SiteFooterItem } from "@sidshub/cms-core/client";
import { createSlug } from "@sidshub/cms-core/content";
import type { HomeCtaButton, TagInfo, CategoryInfo, SeriesInfo } from "./types";

type RelationID = number | string;

const isRelationID = (value: unknown): value is RelationID => {
  return typeof value === "number" || typeof value === "string";
};

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isPublishedPostRelation = (value: RelationID | Post | null | undefined): value is Post => {
  return typeof value === "object" && value !== null && value._status !== "draft";
};

const isPublishedProjectRelation = (
  value: RelationID | Project | null | undefined,
): value is Project => {
  return typeof value === "object" && value !== null && value._status !== "draft";
};

const isPost = (value: RelationID | Post | null | undefined): value is Post => {
  return typeof value === "object" && value !== null && value._status !== "draft";
};

const isProject = (value: RelationID | Project | null | undefined): value is Project => {
  return typeof value === "object" && value !== null && value._status !== "draft";
};

const isSeries = (value: RelationID | Series | null | undefined): value is Series => {
  return typeof value === "object" && value !== null;
};

const PAGE_ROUTES: Record<string, string> = {
  home: "/",
  blog: "/blog",
  projects: "/projects",
  cv: "/cv",
  rss: "/rss.xml",
};

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
};

export function createCmsHelpers(
  { siteUrl }: CmsTransport,
  mediaToUrl: (media: unknown) => string | undefined,
) {
  const toAbsolutePageUrl = (route: string): string => {
    if (!siteUrl) return route;
    try {
      return new URL(route, siteUrl).toString();
    } catch {
      return route;
    }
  };

  const resolveReferenceUrl = (reference: LinkReference): string | undefined => {
    if (!reference || isRelationID(reference)) return undefined;

    const referenceValue = reference.value;
    const postValue = referenceValue as RelationID | Post | null | undefined;
    const projectValue = referenceValue as RelationID | Project | null | undefined;
    const seriesValue = referenceValue as RelationID | Series | null | undefined;

    if (reference.relationTo === "posts" && isPost(postValue) && postValue.slug) {
      return `/blog/${postValue.slug}`;
    }
    if (reference.relationTo === "projects" && isProject(projectValue) && projectValue.slug) {
      return `/projects/${projectValue.slug}`;
    }
    if (reference.relationTo === "series" && isSeries(seriesValue) && seriesValue.slug) {
      return `/blog/series/${seriesValue.slug}`;
    }
    return undefined;
  };

  const resolveLinkUrl = (link: LinkShape | null | undefined): string | undefined => {
    if (!link) return undefined;
    const type = link.type ?? "custom";

    if (type === "custom") return toTrimmedString(link.url);

    if (type === "page") {
      const page = toTrimmedString(link.page);
      if (!page) return undefined;
      const route = PAGE_ROUTES[page];
      return route ? toAbsolutePageUrl(route) : undefined;
    }

    if (type === "reference") return resolveReferenceUrl(link.reference);

    return undefined;
  };

  return {
    homeCtaButtons: (homePage: HomePage): HomeCtaButton[] => {
      return (
        homePage.ctaButtons?.flatMap((button) => {
          const title = toTrimmedString(button.title);
          const href = resolveLinkUrl(button.link);
          if (!title || !href) return [];
          return [
            {
              title,
              href,
              variant: button.variant ?? "default",
              newTab: button.link?.newTab === true,
            },
          ];
        }) ?? []
      );
    },

    featuredPostsFromHomeSection: (
      section: NonNullable<HomePage["featuredSections"]>[number],
    ): Post[] => {
      if (!Array.isArray(section.posts)) return [];
      return section.posts.filter(isPublishedPostRelation);
    },

    featuredProjectsFromHomeSection: (
      section: NonNullable<HomePage["featuredSections"]>[number],
    ): Project[] => {
      if (!Array.isArray(section.projects)) return [];
      return section.projects.filter(isPublishedProjectRelation);
    },

    mediaToUrl,

    categoryFromPost: (post: Post): CategoryInfo | undefined => {
      const category = asCategory(post.primaryCategory);
      if (!category) return undefined;
      return { name: category.name, slug: category.slug };
    },

    tagsFromPost: (post: Post): TagInfo[] => {
      if (!Array.isArray(post.tags)) return [];
      return post.tags.flatMap((tag) => {
        const value = toTrimmedString(tag?.value);
        if (!value) return [];
        return [{ name: value, slug: createSlug(value) }];
      });
    },

    seriesFromPost: (post: Post): SeriesInfo | undefined => {
      const series = asSeries(post.series);
      if (!series) return undefined;
      return { name: series.name, slug: series.slug };
    },

    badgesFromProject: (project: Project): string[] => {
      if (!Array.isArray(project.badges)) return [];
      return project.badges.flatMap((badge) => {
        const value = toTrimmedString(badge?.value);
        return value ? [value] : [];
      });
    },

    tagsFromProject: (project: Project): TagInfo[] => {
      if (!Array.isArray(project.tags)) return [];
      return project.tags.flatMap((tag) => {
        const value = toTrimmedString(tag?.value);
        if (!value) return [];
        return [{ name: value, slug: createSlug(value) }];
      });
    },

    linksFromProject: (project: Project): ProjectLink[] => {
      if (!Array.isArray(project.links)) return [];
      return project.links.flatMap((link) => {
        const icon = toTrimmedString(link.icon as string | undefined);
        if (!icon) return [];
        const url = resolveLinkUrl(link);
        if (!url) return [];
        return [{ icon, url, newTab: link.newTab === true }];
      });
    },

    footerItemsFromSiteSettings: (siteSettings: SiteSetting): SiteFooterItem[] => {
      if (!Array.isArray(siteSettings.sidebarFooterItems)) return [];
      return siteSettings.sidebarFooterItems.flatMap((item) => {
        const icon = toTrimmedString(item?.icon);
        if (!icon) return [];
        const url = resolveLinkUrl(item);
        if (!url) return [];
        return [{ icon, url, newTab: item?.newTab === true }];
      });
    },

    authorsFromPost: (post: Post): Array<PopulatedAuthor | User> => {
      const populatedAuthors = asPopulatedAuthors(post.populatedAuthors);
      if (populatedAuthors.length > 0) return populatedAuthors;
      return asUserArray(post.authors);
    },
  };
}
