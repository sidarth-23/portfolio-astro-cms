import type { Config, Field, Plugin } from "payload";

import type { CollectionOgTarget, GlobalOgTarget, OgImagePluginOptions, OgTarget } from "../types";
import { detectSeoCollections, detectSeoGlobals, validateSeoPluginPresence } from "./detectSeo";
import {
  injectAutoPopulationHook,
  injectSeoButtons,
  injectSocialCardPreview,
  injectSocialCardPreviewGlobal,
  makeSeoFieldsRequired,
  makeSeoFieldsRequiredGlobal,
  resolveButtonMode,
} from "./configTransforms";
import { createGenerateOgImagesEndpoint } from "../server/endpoints/generate";

export function ogImagePlugin(options: OgImagePluginOptions): Plugin {
  return (incomingConfig: Config): Config => {
    // 1. Detect SEO-enabled collections/globals (requires seoPlugin to have run first)
    const seoCollections = detectSeoCollections(incomingConfig);
    const seoGlobals = detectSeoGlobals(incomingConfig);
    validateSeoPluginPresence(seoCollections, seoGlobals);

    // Warn about overrides for non-SEO entities
    if (options.collections) {
      for (const slug of Object.keys(options.collections)) {
        if (!seoCollections.includes(slug)) {
          console.warn(
            `[og-image-plugin] Collection override for "${slug}" was provided but this collection has no SEO meta fields — skipping.`,
          );
        }
      }
    }
    if (options.globals) {
      for (const slug of Object.keys(options.globals)) {
        if (!seoGlobals.includes(slug)) {
          console.warn(
            `[og-image-plugin] Global override for "${slug}" was provided but this global has no SEO meta fields — skipping.`,
          );
        }
      }
    }

    const defaultFolderName = options.defaultFolderName ?? "Auto Generated";

    // 2. Build OgTarget[] from detected entities + user overrides
    const ogTargets: OgTarget[] = [
      ...seoCollections.map((slug): CollectionOgTarget => {
        const override = options.collections?.[slug];
        return {
          type: "collection",
          slug,
          depth: override?.depth,
          ogTitle: override?.ogTitle,
          ogDescription: override?.ogDescription,
          existingImage: override?.existingImage,
          folderName: override?.folderName ?? defaultFolderName,
        };
      }),
      ...seoGlobals.map((slug): GlobalOgTarget => {
        const override = options.globals?.[slug];
        return {
          type: "global",
          slug,
          ogTitle: override?.ogTitle,
          ogDescription: override?.ogDescription,
          folderName: override?.folderName ?? defaultFolderName,
        };
      }),
    ];

    // 3. Build the SocialCardPreview Payload UI field
    const socialCardField: Field = {
      name: "socialCardPreview",
      type: "ui",
      label: "Social Card Preview",
      admin: {
        components: {
          Field: {
            path: "./plugins/og-image/ui#SocialCardPreview",
            clientProps: { siteUrl: options.siteUrl },
          },
        },
      },
    };

    // 5. Transform collections
    const collections = (incomingConfig.collections ?? []).map((collection) => {
      const slug = collection.slug;
      if (!seoCollections.includes(slug)) return collection;

      const override = options.collections?.[slug];
      let transformed = collection;

      if (options.injectSocialCardPreview !== false) {
        transformed = injectSocialCardPreview(transformed, socialCardField);
      }

      if (options.makeSeoFieldsRequired !== false) {
        transformed = makeSeoFieldsRequired(transformed);
      }

      if (options.seoButtons !== false) {
        const buttonMode = resolveButtonMode(transformed, options.seoButtons);
        if (buttonMode !== false) {
          const mapping = override?.seoFieldMapping ?? null;
          transformed = injectSeoButtons(transformed, buttonMode, mapping);
        }
      }

      if (options.injectAutoPopulationHook !== false && override?.seoFieldMapping) {
        transformed = injectAutoPopulationHook(transformed, override.seoFieldMapping);
      }

      return transformed;
    });

    // 6. Transform globals
    const globals = (incomingConfig.globals ?? []).map((global) => {
      const slug = global.slug;
      if (!seoGlobals.includes(slug)) return global;

      let transformed = global;

      if (options.injectSocialCardPreview !== false) {
        transformed = injectSocialCardPreviewGlobal(transformed, socialCardField);
      }

      if (options.makeSeoFieldsRequired !== false) {
        transformed = makeSeoFieldsRequiredGlobal(transformed);
      }

      return transformed;
    });

    // 7. Register the OG generation endpoint
    const endpoints = [
      ...(incomingConfig.endpoints ?? []),
      createGenerateOgImagesEndpoint({ targets: ogTargets, siteUrl: options.siteUrl }),
    ];

    return { ...incomingConfig, collections, globals, endpoints };
  };
}
