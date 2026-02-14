export type Maybe<T> = T | null | undefined;

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

export type CmsMedia = {
  id: string;
  url?: string;
  alt?: string;
  filename?: string;
};

export type CmsMeta = {
  title?: string;
  description?: string;
  image?: CmsMedia | string | null;
};

export type CmsSeoOverrides = {
  canonicalUrl?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  schemaType?: "Article" | "TechArticle";
};

export type CmsCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

export type CmsTag = {
  id: string;
  name: string;
  slug: string;
};

export type CmsSeries = {
  id: string;
  name: string;
  slug: string;
};

export type CmsPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown?: string;
  publishedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  status?: "draft" | "scheduled" | "published";
  scheduledAt?: string;
  coverImage?: CmsMedia | string | null;
  primaryCategory?: CmsCategory | string | null;
  tags?: Array<CmsTag | string>;
  series?: CmsSeries | string | null;
  seriesOrder?: number;
  featureOnHome?: boolean;
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};

export type CmsProject = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  externalUrl: string;
  badge?: string;
  techTags?: Array<{ value: string }>;
  section: "featured" | "newbie";
  displayOrder: number;
  isVisible?: boolean;
  image?: CmsMedia | string | null;
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};

export type SiteSettingsGlobal = {
  siteTitle: string;
  siteDescription: string;
  defaultOgImage?: CmsMedia | string | null;
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
  about: string;
  ctaPrimaryLabel: string;
  ctaPrimaryUrl: string;
  ctaSecondaryLabel: string;
  ctaSecondaryUrl: string;
  latestBlogTitle: string;
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};

export type CvPageGlobal = {
  profile: string;
  education?: Array<{ title: string; subtitle: string }>;
  experience?: Array<{
    title: string;
    subtitle: string;
    items?: Array<{ value: string }>;
  }>;
  certifications?: Array<{ name: string; url: string }>;
  skills?: Array<{ value: string }>;
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};

export type ProjectsPageGlobal = {
  featuredTitle: string;
  featuredDescription: string;
  newbieTitle: string;
  newbieDescription: string;
  meta?: CmsMeta;
  seoOverrides?: CmsSeoOverrides;
};
