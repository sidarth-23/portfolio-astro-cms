import type {
  Category,
  CvPage,
  HomePage,
  Media,
  Post,
  Project,
  ProjectsPage,
  Series,
  SiteSetting,
  Tag,
  User,
} from "@sidshub/cms-config/payload-types";
import type {
  SerializedEditorState,
  SerializedRootNode,
  SerializedParagraphNode,
  SerializedTextNode,
} from "lexical";

export * from "@sidshub/cms-config/payload-types";

export type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
};

export type RawMedia = Media;
export type RawPost = Post;
export type RawProject = Project;
export type RawSiteSettings = SiteSetting;
export type RawHomePage = HomePage;
export type RawCvPage = CvPage;
export type RawProjectsPage = ProjectsPage;

export type RichTextValue = SerializedEditorState;

export type CmsMedia = {
  id: number;
  alt?: string | null;
  caption?: RichTextValue | null;
  url?: string;
  filename?: string;
};

export type CmsMeta = {
  title?: string | null;
  description?: string | null;
  image?: CmsMedia | null;
};

export type CmsSeoOverrides = {
  canonicalUrl?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  schemaType?: "Article" | "TechArticle";
};

export type CmsCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
};

export type CmsTag = {
  id: number;
  name: string;
  slug: string;
};

export type CmsSeries = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
};

export type CmsAuthor = {
  id: number;
  name?: string;
  bio?: RichTextValue | null;
  avatar?: CmsMedia | null;
  linkedInUrl?: string;
  githubUrl?: string;
};

export type CmsPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: RichTextValue;
  publishedAt?: string | null;
  updatedAt?: string;
  createdAt?: string;
  coverImage?: CmsMedia;
  primaryCategory?: CmsCategory;
  tags: CmsTag[];
  series?: CmsSeries;
  seriesOrder?: number | null;
  featureOnHome?: boolean | null;
  authors: CmsAuthor[];
  populatedAuthors: CmsAuthor[];
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};

export type CmsProject = {
  id: number;
  title: string;
  slug: string;
  description: RichTextValue | null;
  externalUrl: string;
  badges?: Array<{ value: string; id?: string | null }> | null;
  techTags?: Array<{ value: string; id?: string | null }> | null;
  displayOrder: number;
  image?: CmsMedia;
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};

export const SITE_FOOTER_ITEM_TYPES = [
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
] as const;

export type SiteFooterItemType = (typeof SITE_FOOTER_ITEM_TYPES)[number];

export type SiteFooterItem = {
  type: SiteFooterItemType;
  url: string;
  id?: string | null;
};

export type SiteSettingsGlobal = {
  siteTitle: string;
  siteDescription: string;
  defaultOgImage?: CmsMedia;
  sidebarFooterItems: SiteFooterItem[];
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};

export type HomePageGlobal = {
  greeting: string;
  name: string;
  role: string;
  about: RichTextValue | null;
  ctaPrimaryLabel: string;
  ctaPrimaryUrl: string;
  ctaSecondaryLabel: string;
  ctaSecondaryUrl: string;
  featuredSectionTitle: string;
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};

export type CvSectionItem = {
  title: string;
  subtitle?: string | null;
  content?: RichTextValue | null;
  id?: string | null;
};

export type CvSection = {
  title: string;
  type: "description";
  description: RichTextValue | null;
  id?: string | null;
} | {
  title: string;
  type: "items";
  itemsVariant: "timeline" | "list" | "columns";
  items: CvSectionItem[];
  id?: string | null;
} | {
  title: string;
  type: "badges";
  badges: Array<{ value: string; id?: string | null }>;
  id?: string | null;
};

export type CvPageGlobal = {
  sections: CvSection[];
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};

export type ProjectsPageSection = {
  title: string;
  description: RichTextValue | null;
  projects: CmsProject[];
  id?: string | null;
};

export type ProjectsPageGlobal = {
  sections: ProjectsPageSection[];
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};

type RelationValue<T> = number | T | null | undefined;

const isObject = <T extends object>(value: unknown): value is T => {
  return typeof value === "object" && value !== null;
};

const textToRichText = (text: string): RichTextValue => {
  return {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              text,
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              version: 1,
            } as SerializedTextNode,
          ],
          direction: null,
          format: "",
          indent: 0,
          version: 1,
          textFormat: 0,
          textStyle: "",
        } as SerializedParagraphNode,
      ],
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    } as SerializedRootNode,
  };
};

const toRichText = (value: unknown): RichTextValue | null => {
  const root = isObject<{ root?: unknown }>(value) ? value.root : undefined;

  if (
    isObject<{ children?: unknown }>(root) &&
    Array.isArray((root as { children?: unknown }).children)
  ) {
    return value as RichTextValue;
  }

  if (typeof value === "string" && value.trim()) {
    return textToRichText(value);
  }

  return null;
};

const toMedia = (value: RelationValue<Media>): CmsMedia | undefined => {
  if (!isObject<Media>(value)) {
    return undefined;
  }

  return {
    id: value.id,
    alt: value.alt,
    caption: toRichText(value.caption),
    url: value.url || undefined,
    filename: value.filename || undefined,
  };
};

const toCategory = (value: RelationValue<Category>): CmsCategory | undefined => {
  if (!isObject<Category>(value)) {
    return undefined;
  }

  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    description: value.description,
  };
};

const toTag = (value: RelationValue<Tag>): CmsTag | undefined => {
  if (!isObject<Tag>(value)) {
    return undefined;
  }

  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
  };
};

const toSeries = (value: RelationValue<Series>): CmsSeries | undefined => {
  if (!isObject<Series>(value)) {
    return undefined;
  }

  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    description: value.description,
  };
};

const toMeta = (
  value:
    | {
        title?: string | null;
        description?: string | null;
        image?: RelationValue<Media>;
      }
    | null
    | undefined,
): CmsMeta | undefined => {
  if (!value) {
    return undefined;
  }

  return {
    title: value.title || undefined,
    description: value.description || undefined,
    image: toMedia(value.image) || null,
  };
};

const toSeoOverrides = (
  value:
    | {
        canonicalUrl?: string | null;
        robotsIndex?: boolean | null;
        robotsFollow?: boolean | null;
        schemaType?: ("Article" | "TechArticle") | null;
      }
    | null
    | undefined,
): CmsSeoOverrides | undefined => {
  if (!value) {
    return undefined;
  }

  return {
    canonicalUrl: value.canonicalUrl || undefined,
    robotsIndex: value.robotsIndex ?? undefined,
    robotsFollow: value.robotsFollow ?? undefined,
    schemaType: value.schemaType || undefined,
  };
};

const toTextOrUndefined = (value: unknown): string | undefined => {
  return typeof value === "string" && value.trim() ? value : undefined;
};

const toTextOrNull = (value: unknown): string | null => {
  return typeof value === "string" && value.trim() ? value : null;
};

const isSiteFooterItemType = (value: unknown): value is SiteFooterItemType => {
  return (
    typeof value === "string" &&
    (SITE_FOOTER_ITEM_TYPES as readonly string[]).includes(value)
  );
};

const normalizeSiteFooterItems = (value: unknown): SiteFooterItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): SiteFooterItem | null => {
      if (!isObject<Record<string, unknown>>(item)) {
        return null;
      }

      const type = item.type;
      const url = toTextOrUndefined(item.url);

      if (!isSiteFooterItemType(type) || !url) {
        return null;
      }

      return {
        type,
        url,
        id: toTextOrNull(item.id),
      };
    })
    .filter((item): item is SiteFooterItem => Boolean(item));
};

const normalizeCvSectionItems = (value: unknown): CvSectionItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): CvSectionItem | null => {
      if (!isObject<Record<string, unknown>>(item)) {
        return null;
      }

      const title = toTextOrUndefined(item.title);
      const id = toTextOrNull(item.id);
      const subtitle = toTextOrNull(item.subtitle);

      if (!title) {
        return null;
      }

      return {
        title,
        subtitle,
        content: toRichText(item.content),
        id,
      };
    })
    .filter((item): item is CvSectionItem => Boolean(item));
};

const normalizeCvSections = (value: unknown): CvSection[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((section): CvSection | null => {
      if (!isObject<Record<string, unknown>>(section)) {
        return null;
      }

      const title = toTextOrUndefined(section.title);
      const type = toTextOrUndefined(section.type);
      const id = toTextOrNull(section.id);

      if (!title || !type) {
        return null;
      }

      if (type === "description") {
        return {
          title,
          type,
          description: toRichText(section.description),
          id,
        };
      }

      if (type === "items") {
        const itemsVariant = toTextOrUndefined(section.itemsVariant);
        if (itemsVariant !== "timeline" && itemsVariant !== "list" && itemsVariant !== "columns") {
          return null;
        }

        return {
          title,
          type,
          itemsVariant,
          items: normalizeCvSectionItems(section.items),
          id,
        };
      }

      if (type === "badges") {
        const badges = Array.isArray(section.badges)
          ? section.badges
              .map((badge) => {
                if (!isObject<Record<string, unknown>>(badge)) {
                  return null;
                }

                const value = toTextOrUndefined(badge.value);
                if (!value) {
                  return null;
                }

                return {
                  value,
                  id: toTextOrNull(badge.id),
                };
              })
              .filter((badge): badge is { value: string; id: string | null } => badge !== null)
          : [];

        return {
          title,
          type,
          badges,
          id,
        };
      }

      return null;
    })
    .filter((section): section is CvSection => Boolean(section));
};

const toProjectFromRelation = (value: RelationValue<Project>): CmsProject | undefined => {
  if (!isObject<Project>(value)) {
    return undefined;
  }

  return normalizeProject(value);
};

const normalizeProjectsPageSections = (value: unknown): ProjectsPageSection[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((section): ProjectsPageSection | null => {
      if (!isObject<Record<string, unknown>>(section)) {
        return null;
      }

      const title = toTextOrUndefined(section.title);
      if (!title) {
        return null;
      }

      const projects = Array.isArray(section.projects)
        ? section.projects
            .map((project) => toProjectFromRelation(project as RelationValue<Project>))
            .filter((project): project is CmsProject => Boolean(project))
        : [];

      return {
        title,
        description: toRichText(section.description),
        projects,
        id: toTextOrNull(section.id),
      };
    })
    .filter((section): section is ProjectsPageSection => Boolean(section));
};

type RawPopulatedAuthor = {
  id: number;
  name?: string | null;
  bio?: unknown;
  avatar?: RelationValue<Media>;
  linkedInUrl?: string | null;
  githubUrl?: string | null;
};

const toAuthorFromUser = (value: RelationValue<User>): CmsAuthor | undefined => {
  if (!isObject<User>(value)) {
    return undefined;
  }

  return {
    id: value.id,
    name: value.name || undefined,
    bio: toRichText(value.bio),
    avatar: toMedia(value.avatar) || null,
    linkedInUrl: value.linkedInUrl || undefined,
    githubUrl: value.githubUrl || undefined,
  };
};

const toAuthorFromPopulated = (value: unknown): CmsAuthor | undefined => {
  if (!isObject<RawPopulatedAuthor>(value) || typeof value.id !== "number") {
    return undefined;
  }

  return {
    id: value.id,
    name: value.name || undefined,
    bio: toRichText(value.bio),
    avatar: toMedia(value.avatar) || null,
    linkedInUrl: value.linkedInUrl || undefined,
    githubUrl: value.githubUrl || undefined,
  };
};

export const normalizePost = (post: RawPost): CmsPost => {
  const populatedAuthors = (post.populatedAuthors || [])
    .map((author) => toAuthorFromPopulated(author))
    .filter((author): author is CmsAuthor => Boolean(author));

  const authorsFromRelationship = (post.authors || [])
    .map((author) => toAuthorFromUser(author))
    .filter((author): author is CmsAuthor => Boolean(author));

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: toRichText(post.content) || textToRichText(""),
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    createdAt: post.createdAt,
    coverImage: toMedia(post.coverImage),
    primaryCategory: toCategory(post.primaryCategory),
    tags: (post.tags || []).map((tag) => toTag(tag)).filter((tag): tag is CmsTag => Boolean(tag)),
    series: toSeries(post.series),
    seriesOrder: post.seriesOrder,
    featureOnHome: post.featureOnHome,
    authors: authorsFromRelationship,
    populatedAuthors: populatedAuthors.length ? populatedAuthors : authorsFromRelationship,
    meta: toMeta(post.meta),
    seoOverrides: toSeoOverrides((post as unknown as { seoOverrides?: unknown }).seoOverrides as {
      canonicalUrl?: string | null;
      robotsIndex?: boolean | null;
      robotsFollow?: boolean | null;
      schemaType?: ("Article" | "TechArticle") | null;
    } | null | undefined),
  };
};

export const normalizeProject = (project: RawProject): CmsProject => {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    description: toRichText(project.description),
    externalUrl: project.externalUrl,
    badges: project.badges,
    techTags: project.techTags,
    displayOrder: project.displayOrder,
    image: toMedia(project.image),
    meta: toMeta(project.meta),
    seoOverrides: toSeoOverrides((project as unknown as { seoOverrides?: unknown }).seoOverrides as {
      canonicalUrl?: string | null;
      robotsIndex?: boolean | null;
      robotsFollow?: boolean | null;
      schemaType?: ("Article" | "TechArticle") | null;
    } | null | undefined),
  };
};

export const normalizeSiteSettings = (siteSettings: RawSiteSettings): SiteSettingsGlobal => {
  return {
    siteTitle: siteSettings.siteTitle,
    siteDescription: siteSettings.siteDescription,
    defaultOgImage: toMedia(siteSettings.defaultOgImage),
    sidebarFooterItems: normalizeSiteFooterItems(siteSettings.sidebarFooterItems),
    meta: toMeta(siteSettings.meta),
    seoOverrides: undefined,
  };
};

export const normalizeHomePage = (homePage: RawHomePage): HomePageGlobal => {
  return {
    greeting: homePage.greeting,
    name: homePage.name,
    role: homePage.role,
    about: toRichText(homePage.about),
    ctaPrimaryLabel: homePage.ctaPrimaryLabel,
    ctaPrimaryUrl: homePage.ctaPrimaryUrl,
    ctaSecondaryLabel: homePage.ctaSecondaryLabel,
    ctaSecondaryUrl: homePage.ctaSecondaryUrl,
    featuredSectionTitle: homePage.featuredSectionTitle,
    meta: toMeta(homePage.meta),
    seoOverrides: undefined,
  };
};

export const normalizeCvPage = (cvPage: RawCvPage): CvPageGlobal => {
  const sections = (cvPage as unknown as { sections?: unknown }).sections;

  return {
    sections: normalizeCvSections(sections),
    meta: toMeta(cvPage.meta),
    seoOverrides: undefined,
  };
};

export const normalizeProjectsPage = (projectsPage: RawProjectsPage): ProjectsPageGlobal => {
  const sections = (projectsPage as unknown as { sections?: unknown }).sections;

  return {
    sections: normalizeProjectsPageSections(sections),
    meta: toMeta(projectsPage.meta),
    seoOverrides: undefined,
  };
};
