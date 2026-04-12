import { z } from "zod";

import {
  optionalHttpUrl,
  optionalSlugLikeText,
  optionalText,
  optionalTextWithFallback,
  requiredHttpUrl,
  requiredText,
} from "./primitives";

const seoMetaSchema = z
  .object({
    title: requiredText.optional(),
    description: requiredText.optional(),
  })
  .passthrough();

const withSeoMeta = <T extends z.ZodRawShape>(shape: T) => {
  return z
    .object({
      ...shape,
      meta: seoMetaSchema.optional(),
    })
    .passthrough();
};

export const homePageSchema = withSeoMeta({
  greeting: requiredText.optional(),
  name: requiredText.optional(),
  role: requiredText.optional(),
  about: z.unknown().optional(),
  featured: z
    .object({
      title: optionalText,
      description: optionalText,
      items: z.unknown().optional(),
    })
    .passthrough()
    .optional(),
});

export const blogPageSchema = withSeoMeta({
  title: requiredText.optional(),
  intro: optionalText,
});

export const projectsPageSchema = withSeoMeta({
  sections: z
    .array(
      z
        .object({
          title: requiredText.optional(),
          description: z.unknown().optional(),
          projects: z.unknown().optional(),
        })
        .passthrough(),
    )
    .optional(),
});

export const seriesPageSchema = withSeoMeta({
  backToSeriesLabel: optionalTextWithFallback("Back to Series").optional(),
});

export const notFoundPageSchema = withSeoMeta({
  title: requiredText.optional(),
  description: requiredText.optional(),
  ctaLabel: optionalTextWithFallback("Home").optional(),
  ctaHref: optionalTextWithFallback("/").optional(),
  emoji: optionalTextWithFallback("🏝").optional(),
});

const cvBadgeSchema = z
  .object({
    value: requiredText.optional(),
    iconSlug: optionalSlugLikeText,
  })
  .passthrough();

const cvBadgeGroupSchema = z
  .object({
    title: requiredText.optional(),
    badges: z.array(cvBadgeSchema).optional(),
  })
  .passthrough();

const cvItemSchema = z
  .object({
    title: requiredText.optional(),
    subtitle: optionalText,
    organization: optionalText,
    location: optionalText,
    url: optionalHttpUrl,
  })
  .passthrough();

export const cvPageSchema = withSeoMeta({
  sections: z
    .array(
      z
        .object({
          title: requiredText.optional(),
          type: z.enum(["description", "items", "badges"]).optional(),
          items: z.array(cvItemSchema).optional(),
          badgeGroups: z.array(cvBadgeGroupSchema).optional(),
        })
        .passthrough(),
    )
    .optional(),
});

export const postsSchema = withSeoMeta({
  title: requiredText.optional(),
  excerpt: requiredText.optional(),
});

const projectLabelSchema = z
  .object({
    value: requiredText.optional(),
  })
  .passthrough();

export const projectsSchema = withSeoMeta({
  title: requiredText.optional(),
  externalUrl: requiredHttpUrl.optional(),
  githubUrl: optionalHttpUrl,
  badges: z.array(projectLabelSchema).optional(),
  tags: z.array(projectLabelSchema).optional(),
});

export const seriesSchema = withSeoMeta({
  name: requiredText.optional(),
  description: optionalText,
});

export const tagsSchema = z
  .object({
    name: requiredText.optional(),
    description: optionalText,
  })
  .passthrough();

export const categoriesSchema = z
  .object({
    name: requiredText.optional(),
    description: optionalText,
  })
  .passthrough();

export const usersSchema = z
  .object({
    name: requiredText.optional(),
    linkedInUrl: optionalHttpUrl,
    githubUrl: optionalHttpUrl,
  })
  .passthrough();
