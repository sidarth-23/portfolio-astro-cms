import { z } from "zod";

import {
  CV_SECTION_TYPE_OPTIONS,
  HOME_CTA_VARIANT_OPTIONS,
} from "../content";
import { isPhosphorIconName, isSimpleIconSlug } from "../icons";
import {
  optionalHttpUrl,
  optionalLinkUrl,
  optionalText,
  optionalTextWithFallback,
  requiredHttpUrl,
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

export const siteSettingsSchema = z.object({
  sidebarFooterItems: z.array(
    z.object({
      icon: optionalStrictIcon,
      url: optionalLinkUrl,
      newTab: z.boolean().optional(),
      type: z.enum(["custom", "reference", "page"]).optional(),
    }).passthrough()
  ).optional(),
}).passthrough();

export const homePageSchema = withSeoMeta({
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
          collection: z.enum(["posts", "projects"]).optional(),
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
    icon: optionalStrictIcon,
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
          type: z.enum(CV_SECTION_TYPE_VALUES).optional(),
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
    links: z.array(
      z.object({
        icon: optionalStrictIcon,
        url: optionalLinkUrl,
        newTab: z.boolean().optional(),
        type: z.enum(["custom", "reference", "page"]).optional(),
      }).passthrough()
    ).optional(),
  })
  .passthrough();
