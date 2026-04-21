import { z } from "zod";

import { CV_SECTION_TYPE_OPTIONS, HOME_CTA_VARIANT_OPTIONS } from "@/lib/content";
import { isPhosphorIconName, isSimpleIconSlug } from "@/lib/icons";
import {
  optionalHttpUrl,
  optionalLinkUrl,
  optionalText,
  optionalTextWithFallback,
  requiredText,
} from "./primitives";

const strictIconSchema = z.string().superRefine((value, ctx) => {
  if (value.startsWith("si:")) {
    const slug = value.slice(3).trim();
    if (isSimpleIconSlug(slug)) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Unknown Simple Icons slug.",
    });
    return;
  }

  if (value.startsWith("ph:")) {
    const name = value.slice(3).trim();
    if (isPhosphorIconName(name)) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Unknown Phosphor icon name.",
    });
    return;
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Icon must use canonical format (`si:<slug>` or `ph:<name>`).",
  });
});

const optionalStrictIcon = z.preprocess((value: unknown) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, strictIconSchema.optional());

const HOME_CTA_VARIANT_VALUES = HOME_CTA_VARIANT_OPTIONS.map((option) => option.value) as [
  (typeof HOME_CTA_VARIANT_OPTIONS)[number]["value"],
  ...(typeof HOME_CTA_VARIANT_OPTIONS)[number]["value"][],
];
const CV_SECTION_TYPE_VALUES = CV_SECTION_TYPE_OPTIONS.map((option) => option.value) as [
  (typeof CV_SECTION_TYPE_OPTIONS)[number]["value"],
  ...(typeof CV_SECTION_TYPE_OPTIONS)[number]["value"][],
];

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

export const siteSettingsSchema = withSeoMeta({
  sidebarFooterItems: z
    .array(
      z
        .object({
          icon: optionalStrictIcon,
          url: optionalLinkUrl,
          newTab: z.boolean().optional(),
          type: z.enum(["custom", "reference", "page"]).optional(),
        })
        .passthrough(),
    )
    .optional(),
});

export const homePageSchema = z
  .object({
    greeting: requiredText.optional(),
    name: requiredText.optional(),
    role: requiredText.optional(),
    about: z.unknown().optional(),
    featuredSections: z
      .array(
        z
          .object({
            name: requiredText.optional(),
            description: z.unknown().optional(),
            sourceCollection: z.enum(["posts", "projects"]).optional(),
            posts: z.unknown().optional(),
            projects: z.unknown().optional(),
          })
          .passthrough(),
      )
      .optional(),
    ctaButtons: z
      .array(
        z
          .object({
            title: requiredText.optional(),
            variant: z.enum(HOME_CTA_VARIANT_VALUES).optional(),
            link: z.unknown().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

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

const cvBadgeSchema = z
  .object({
    value: requiredText.optional(),
    icon: optionalStrictIcon,
  })
  .passthrough();

const cvBadgeGroupSchema = z
  .object({
    title: requiredText.optional(),
    badges: z.array(cvBadgeSchema).nullish(),
  })
  .passthrough();

const cvItemSchema = z
  .object({
    itemType: z.enum(["generic", "organizationRole", "linked"]).optional(),
    title: requiredText.optional(),
    subtitle: optionalText.nullish(),
    startMonth: z.string().nullish(),
    organization: optionalText.nullish(),
    location: optionalText.nullish(),
    endMonth: z.string().nullish(),
    currentlyWorkingHere: z.boolean().optional(),
    url: optionalHttpUrl.nullish(),
  })
  .passthrough();

export const cvPageSchema = withSeoMeta({
  sections: z
    .array(
      z
        .object({
          title: requiredText.optional(),
          type: z.enum(CV_SECTION_TYPE_VALUES).optional(),
          items: z.array(cvItemSchema).nullish(),
          badgeGroups: z.array(cvBadgeGroupSchema).nullish(),
        })
        .passthrough(),
    )
    .optional(),
});

export const postsSchema = withSeoMeta({
  title: requiredText.optional(),
  description: requiredText.optional(),
  tags: z.array(z.object({ value: requiredText.optional() }).passthrough()).optional(),
});

const projectLabelSchema = z
  .object({
    value: requiredText.optional(),
    icon: optionalStrictIcon,
  })
  .passthrough();

export const projectsSchema = withSeoMeta({
  title: requiredText.optional(),
  links: z
    .array(
      z
        .object({
          icon: optionalStrictIcon,
          url: optionalLinkUrl,
          newTab: z.boolean().optional(),
          type: z.enum(["custom", "reference", "page"]).optional(),
        })
        .passthrough(),
    )
    .optional(),
  badges: z.array(projectLabelSchema).optional(),
  tags: z.array(projectLabelSchema).optional(),
});

export const seriesSchema = withSeoMeta({
  name: requiredText.optional(),
  description: optionalText,
  posts: z
    .array(z.union([z.string(), z.number(), z.object({}).passthrough()]))
    .min(2, "Series must have at least 2 posts.")
    .optional(),
});

export const categoriesSchema = z
  .object({
    name: requiredText.optional(),
    description: optionalText,
  })
  .passthrough();

export const usersSchema = z
  .object({
    name: requiredText.optional(),
    links: z
      .array(
        z
          .object({
            icon: optionalStrictIcon,
            url: optionalLinkUrl,
            newTab: z.boolean().optional(),
            type: z.enum(["custom", "reference", "page"]).optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();
