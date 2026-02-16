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
  summary: string;
  description?: RichTextValue | null;
  externalUrl: string;
  badge?: string;
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
  education?: Array<{ title: string; subtitle: string; id?: string | null }> | null;
  experience?:
    | Array<{
        title: string;
        subtitle: string;
        items?: Array<{ value: string; id?: string | null }> | null;
        id?: string | null;
      }>
    | null;
  certifications?: Array<{ name: string; url: string; id?: string | null }> | null;
  skills?: Array<{ value: string; id?: string | null }> | null;
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
    summary: project.summary,
    description: toRichText(project.description),
    externalUrl: project.externalUrl,
    badge: project.badge || undefined,
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
    education: cvPage.education,
    experience: cvPage.experience,
    certifications: cvPage.certifications,
    skills: cvPage.skills,
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
