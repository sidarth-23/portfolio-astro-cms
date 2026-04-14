import { seoPlugin } from "@payloadcms/plugin-seo";
import { buildConfig } from "payload";
import type { CollectionConfig, Config, EmailAdapter, Field, GlobalConfig, Plugin } from "payload";

import { setReadAccessToken } from "@/access/readAccessConfig";
import { Categories } from "@/collections/Categories";
import { Media } from "@/collections/Media";
import { Posts } from "@/collections/Posts";
import { Projects } from "@/collections/Projects";
import { Series } from "@/collections/Series";
import { Users } from "@/collections/Users";
import { deploymentStatusEndpoint } from "@/endpoints/deploymentStatus";
import { generateOgImagesEndpoint } from "@/endpoints/generateOgImages";
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
import type { HookType } from "@/lib/deployment/factory";
import type { DeploymentStatusAdapter } from "@/lib/deployment/types";
import { createBasicRichTextEditor } from "@/lib/editor";
import { SEO_COLLECTIONS, SEO_GLOBALS } from "@/lib/og/registry";

let _deploymentStatusAdapter: DeploymentStatusAdapter | undefined;
let _showDeploymentStatusCard = false;
let _deploymentHookType: HookType | undefined;
let _deploymentHookValid = false;

export function setDeploymentStatusAdapter(adapter: DeploymentStatusAdapter | undefined) {
  _deploymentStatusAdapter = adapter;
}

export function getDeploymentStatusAdapter(): DeploymentStatusAdapter | undefined {
  return _deploymentStatusAdapter;
}

export function setShowDeploymentStatusCard(show: boolean) {
  _showDeploymentStatusCard = show;
}

export function getShowDeploymentStatusCard(): boolean {
  return _showDeploymentStatusCard;
}

export function setDeploymentHookType(type: HookType | undefined) {
  _deploymentHookType = type;
}

export function getDeploymentHookType(): HookType | undefined {
  return _deploymentHookType;
}

export function setDeploymentHookValid(valid: boolean) {
  _deploymentHookValid = valid;
}

export function getDeploymentHookValid(): boolean {
  return _deploymentHookValid;
}

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
  deploymentStatus?: DeploymentStatusAdapter;
  showDeploymentStatus?: boolean;
  deploymentHookType?: HookType;
  deploymentHookValid?: boolean;
};

export function createCmsConfig(options: CmsConfigOptions) {
  setReadAccessToken(options.readAccessToken);
  setDeploymentStatusAdapter(options.deploymentStatus);
  setShowDeploymentStatusCard(options.showDeploymentStatus ?? false);
  setDeploymentHookType(options.deploymentHookType);
  setDeploymentHookValid(options.deploymentHookValid ?? false);

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

  const withSeoOverrides = ({ defaultFields }: { defaultFields: Field[] }): Field[] => {
    const fields = defaultFields.map((field) => {
      if ("name" in field && (field.name === "title" || field.name === "description")) {
        return { ...field, required: true };
      }
      return field;
    });

    // Insert social card preview immediately after the SERP preview field
    const socialCardField: Field = {
      name: "socialCardPreview",
      type: "ui",
      admin: {
        components: {
          Field: {
            clientProps: { siteUrl },
            path: "./components/admin/seo/SocialCardPreview#SocialCardPreview",
          },
        },
      },
      label: "Social Card Preview",
    };

    const previewIdx = fields.findIndex((f) => "name" in f && f.name === "preview");
    if (previewIdx !== -1) {
      fields.splice(previewIdx + 1, 0, socialCardField);
    } else {
      fields.push(socialCardField);
    }

    return fields;
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
        baseDir: import.meta.dirname,
      },
    },
    routes: {
      admin: "/",
    },
    endpoints: [
      generateOgImagesEndpoint(options.siteUrl),
      deploymentStatusEndpoint,
      ...orphanedMediaEndpoints,
    ],
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
        fields: withSeoOverrides,
      }),
      ...(options.storagePlugins ?? []),
    ],
    db: options.db,
    secret: options.secret,
    typescript: {
      outputFile: new URL("./payload-types.ts", import.meta.url).pathname,
    },
  });
}
