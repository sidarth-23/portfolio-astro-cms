import { seoPlugin } from "@payloadcms/plugin-seo";
import { deploymentLogViewPlugin } from "@sidshub/cms-plugin-deployment-log-view/plugin";
import {
  convertMarkdownEndpoint,
  importMediaFromUrlEndpoint,
} from "@sidshub/cms-plugin-markdown-paste/endpoints";
import { ogImagePlugin, collectionOverride, globalOverride } from "@sidshub/cms-plugin-og-image";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import type { CollectionConfig, Config, EmailAdapter, GlobalConfig, Plugin } from "payload";

import { setReadAccessToken } from "@/access/readAccessConfig";
import { Categories } from "@/collections/Categories";
import { Media } from "@/collections/Media";
import { Posts } from "@/collections/Posts";
import { Projects } from "@/collections/Projects";
import { Series } from "@/collections/Series";
import { Users } from "@/collections/Users";
import { orphanedMediaEndpoints } from "@/endpoints/orphanedMedia";
import { BlogPage } from "@/globals/BlogPage";
import { CvPage } from "@/globals/CvPage";
import { HomePage } from "@/globals/HomePage";
import { ProjectsPage } from "@/globals/ProjectsPage";
import { SeriesPage } from "@/globals/SeriesPage";
import { SiteSettings } from "@/globals/SiteSettings";
import { createCollectionRedeployHook } from "@/hooks/triggerCollectionRedeploy";
import { createTriggerDeployment } from "@/hooks/triggerDeployment";
import { createTriggerDevRefresh } from "@/hooks/triggerDevRefresh";
import { createGlobalRedeployHook } from "@/hooks/triggerGlobalRedeploy";
import { createBasicRichTextEditor } from "@/lib/editor";
import { SEO_COLLECTIONS, SEO_GLOBALS } from "@/registry";
import type {
  Post,
  Project,
  Series as SeriesType,
  BlogPage as BlogPageType,
  CvPage as CvPageType,
  ProjectsPage as ProjectsPageType,
  SeriesPage as SeriesPageType,
  SiteSetting,
} from "@/payload-types";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export type CmsConfigOptions = {
  secret: string;
  serverURL: string;
  siteUrl?: string;
  db: Config["db"];
  email: EmailAdapter;
  storagePlugins?: Plugin[];
  readAccessToken: string;
  deployHook?: { webhookUrl: string; branch: string };
  devRefreshUrl?: string;
  onInit?: () => Promise<void>;
  deploymentLogView?: Parameters<typeof deploymentLogViewPlugin>[0];
};

export function createCmsConfig(options: CmsConfigOptions) {
  setReadAccessToken(options.readAccessToken);

  const triggerDeploy = createTriggerDeployment(options.deployHook);
  const triggerRefresh = createTriggerDevRefresh(options.devRefreshUrl);
  const collectionRedeployHook = createCollectionRedeployHook(triggerDeploy, triggerRefresh);
  const globalRedeployHook = createGlobalRedeployHook(triggerDeploy, triggerRefresh);

  const withCollectionAfterChangeHook = (collection: CollectionConfig): CollectionConfig => ({
    ...collection,
    hooks: {
      ...collection.hooks,
      afterChange: [...(collection.hooks?.afterChange ?? []), collectionRedeployHook],
    },
  });

  const withGlobalAfterChangeHook = (globalConfig: GlobalConfig): GlobalConfig => ({
    ...globalConfig,
    hooks: {
      ...globalConfig.hooks,
      afterChange: [...(globalConfig.hooks?.afterChange ?? []), globalRedeployHook],
    },
  });

  const siteUrl = options.siteUrl ?? "https://sidshub.in";

  // URL mapping: collection/global slug → public-facing URL on the frontend
  const generateURL = ({
    doc,
    collectionSlug,
    globalSlug,
  }: {
    doc: Record<string, unknown>;
    collectionSlug?: string;
    globalSlug?: string;
  }): string => {
    if (collectionSlug === "posts") return `${siteUrl}/blog/${doc.slug ?? ""}`;
    if (collectionSlug === "projects") return `${siteUrl}/projects/${doc.slug ?? ""}`;
    if (collectionSlug === "series") return `${siteUrl}/blog/series/${doc.slug ?? ""}`;
    if (globalSlug === "site-settings" || globalSlug === "home-page") return siteUrl;
    if (globalSlug === "blog-page" || globalSlug === "series-page") return `${siteUrl}/blog`;
    if (globalSlug === "cv-page") return `${siteUrl}/cv`;
    if (globalSlug === "projects-page") return `${siteUrl}/projects`;
    return siteUrl;
  };

  const collections: CollectionConfig[] = [Users, Media, Categories, Series, Posts, Projects].map(
    withCollectionAfterChangeHook,
  );
  const globals: GlobalConfig[] = [
    SiteSettings,
    HomePage,
    CvPage,
    BlogPage,
    SeriesPage,
    ProjectsPage,
  ].map(withGlobalAfterChangeHook);

  return buildConfig({
    // Experimental in Payload v3 — may change in minor versions until stable.
    folders: {},
    debug: true,
    editor: createBasicRichTextEditor(),
    serverURL: options.serverURL,
    email: options.email,
    admin: {
      user: Users.slug,
      components: {
        afterNavLinks: ["./components/admin/nav/DashboardNavLink#DashboardNavLink"],
        views: {
          dashboard: {
            Component: "./components/admin/Dashboard#DashboardView",
          },
          setupChecklist: {
            Component: "./components/admin/SetupChecklistView#SetupChecklistView",
            path: "/setup-checklist",
          },
        },
      },
      importMap: {
        baseDir: dirname,
      },
    },
    routes: {
      admin: "/",
    },
    endpoints: [importMediaFromUrlEndpoint, convertMarkdownEndpoint, ...orphanedMediaEndpoints],
    collections,
    globals,
    onInit: async () => {
      await options.onInit?.();
    },
    plugins: [
      seoPlugin({
        collections: [...SEO_COLLECTIONS],
        globals: [...SEO_GLOBALS],
        tabbedUI: true,
        uploadsCollection: "media",
        generateURL,
      }),
      ogImagePlugin({
        siteUrl,
        collections: {
          posts: collectionOverride<Post>({
            ogTitle: "title",
            existingImage: "coverImage",
            depth: 1,
            seoFieldMapping: {
              titleField: "title",
              descriptionField: "description",
              imageField: "coverImage",
            },
          }),
          projects: collectionOverride<Project>({
            ogTitle: "title",
            existingImage: "coverImage",
            depth: 1,
            seoFieldMapping: {
              titleField: "title",
              descriptionField: "description",
              imageField: "coverImage",
            },
          }),
          series: collectionOverride<SeriesType>({
            seoFieldMapping: {
              titleField: "name",
              descriptionField: "description",
              imageField: null,
            },
          }),
        },
        globals: {
          "cv-page": globalOverride<CvPageType>({}),
          "blog-page": globalOverride<BlogPageType>({}),
          "series-page": globalOverride<SeriesPageType>({}),
          "projects-page": globalOverride<ProjectsPageType>({}),
          "site-settings": globalOverride<SiteSetting>({}),
        },
      }),
      deploymentLogViewPlugin(options.deploymentLogView ?? { enabled: false }),
      ...(options.storagePlugins ?? []),
    ],
    db: options.db,
    secret: options.secret,
    typescript: {
      // Keep cms-core as the canonical owner of generated Payload types.
      outputFile: path.resolve(dirname, "../src/payload-types.ts"),
    },
  });
}
