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
} from "./payload-types";
import type {
  SerializedEditorState,
  SerializedRootNode,
  SerializedParagraphNode,
  SerializedTextNode,
} from "lexical";

export * from "./payload-types";

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
  section: "featured" | "newbie";
  displayOrder: number;
  image?: CmsMedia;
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};

export type SiteSettingsGlobal = {
  siteTitle: string;
  siteDescription: string;
  defaultOgImage?: CmsMedia;
  linkedInUrl?: string;
  githubUrl?: string;
  email?: string;
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
  latestBlogTitle: string;
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};

export type CvPageGlobal = {
  profile: RichTextValue | null;
  education?: CvSectionEntry[] | null;
  experience?: CvSectionEntry[] | null;
  certifications?: CvSectionEntry[] | null;
  skills?: CvSectionEntry[] | null;
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};

export type ProjectsPageGlobal = {
  featuredTitle: string;
  featuredDescription: RichTextValue | null;
  newbieTitle: string;
  newbieDescription: RichTextValue | null;
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};

type RelationValue<T> = number | T | null | undefined;
type CvSectionEntry = {
  key: string;
  summary?: string | null;
  content: RichTextValue | null;
  id?: string | null;
};

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

const normalizeCvSectionItems = (value: unknown): CvSectionEntry[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value
    .map((item): CvSectionEntry | null => {
      if (!isObject<Record<string, unknown>>(item)) {
        return null;
      }

      const id = toTextOrNull(item.id);
      const key = toTextOrUndefined(item.key);
      const summary = toTextOrNull(item.summary);

      if (key) {
        return {
          key,
          summary,
          content: toRichText(item.content),
          id,
        };
      }

      const legacyTitle = toTextOrUndefined(item.title);
      const legacySubtitle = toTextOrNull(item.subtitle);
      const legacyName = toTextOrUndefined(item.name);
      const legacyUrl = toTextOrNull(item.url);
      const legacyValue = toTextOrUndefined(item.value);
      const legacyItems = Array.isArray(item.items) ? item.items : [];

      const legacyExperienceItems = legacyItems
        .map((legacyItem) => {
          if (!isObject<Record<string, unknown>>(legacyItem)) {
            return null;
          }

          return toTextOrUndefined(legacyItem.value) || null;
        })
        .filter((legacyItem): legacyItem is string => Boolean(legacyItem));

      if (legacyTitle) {
        return {
          key: legacyTitle,
          summary: legacySubtitle,
          content: toRichText(
            legacyExperienceItems.length > 0 ? legacyExperienceItems.join("\n") : legacySubtitle,
          ),
          id,
        };
      }

      if (legacyName) {
        return {
          key: legacyName,
          summary: legacyUrl,
          content: toRichText(legacyUrl),
          id,
        };
      }

      if (legacyValue) {
        return {
          key: legacyValue,
          summary: null,
          content: toRichText(legacyValue),
          id,
        };
      }

      return null;
    })
    .filter((item): item is CvSectionEntry => Boolean(item));

  return items.length > 0 ? items : null;
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
    seoOverrides: toSeoOverrides(post.seoOverrides),
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
    section: project.section,
    displayOrder: project.displayOrder,
    image: toMedia(project.image),
    meta: toMeta(project.meta),
    seoOverrides: toSeoOverrides(project.seoOverrides),
  };
};

export const normalizeSiteSettings = (siteSettings: RawSiteSettings): SiteSettingsGlobal => {
  return {
    siteTitle: siteSettings.siteTitle,
    siteDescription: siteSettings.siteDescription,
    defaultOgImage: toMedia(siteSettings.defaultOgImage),
    linkedInUrl: siteSettings.linkedInUrl || undefined,
    githubUrl: siteSettings.githubUrl || undefined,
    email: siteSettings.email || undefined,
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
    latestBlogTitle: homePage.latestBlogTitle,
    meta: toMeta(homePage.meta),
    seoOverrides: undefined,
  };
};

export const normalizeCvPage = (cvPage: RawCvPage): CvPageGlobal => {
  return {
    profile: toRichText(cvPage.profile),
    education: normalizeCvSectionItems(cvPage.education),
    experience: normalizeCvSectionItems(cvPage.experience),
    certifications: normalizeCvSectionItems(cvPage.certifications),
    skills: normalizeCvSectionItems(cvPage.skills),
    meta: toMeta(cvPage.meta),
    seoOverrides: undefined,
  };
};

export const normalizeProjectsPage = (projectsPage: RawProjectsPage): ProjectsPageGlobal => {
  return {
    featuredTitle: projectsPage.featuredTitle,
    featuredDescription: toRichText(projectsPage.featuredDescription),
    newbieTitle: projectsPage.newbieTitle,
    newbieDescription: toRichText(projectsPage.newbieDescription),
    meta: toMeta(projectsPage.meta),
    seoOverrides: undefined,
  };
};
