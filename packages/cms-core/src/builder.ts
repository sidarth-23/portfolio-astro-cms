import path from "path";
import { fileURLToPath } from "url";

import { createBasicRichTextEditor } from "@sidshub/cms-editor/cms";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { buildConfig } from "payload";
import type { CollectionConfig, Config, EmailAdapter, Field, GlobalConfig, Plugin } from "payload";

import { Categories } from "./collections/Categories";
import { Media } from "./collections/Media";
import { Posts } from "./collections/Posts";
import { Projects } from "./collections/Projects";
import { Series } from "./collections/Series";
import { Users } from "./collections/Users";
import { BlogPage } from "./globals/BlogPage";
import { CvPage } from "./globals/CvPage";
import { HomePage } from "./globals/HomePage";
import { NotFoundPage } from "./globals/NotFoundPage";
import { ProjectsPage } from "./globals/ProjectsPage";
import { SeriesPage } from "./globals/SeriesPage";
import { SiteSettings } from "./globals/SiteSettings";
import { setReadAccessToken } from "./access/readAccessConfig";
import { generateOgImagesEndpoint } from "./endpoints/generateOgImages";
import { createCollectionRedeployHook } from "./hooks/triggerCollectionRedeploy";
import { createTriggerDeployment } from "./hooks/triggerDeployment";
import { createTriggerDevRefresh } from "./hooks/triggerDevRefresh";
import { createGlobalRedeployHook } from "./hooks/triggerGlobalRedeploy";
import { SEO_COLLECTIONS, SEO_GLOBALS } from "./lib/og/registry";
import type { DeploymentStatusAdapter } from './lib/deployment/types'

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

let _deploymentStatusAdapter: DeploymentStatusAdapter | undefined

export function setDeploymentStatusAdapter(adapter: DeploymentStatusAdapter | undefined) {
  _deploymentStatusAdapter = adapter
}

export function getDeploymentStatusAdapter(): DeploymentStatusAdapter | undefined {
  return _deploymentStatusAdapter
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
};

const withRequiredSeoFields = ({ defaultFields }: { defaultFields: Field[] }): Field[] => {
  return defaultFields.map((field) => {
    if ("name" in field && (field.name === "title" || field.name === "description")) {
      return { ...field, required: true };
    }
    return field;
  });
};

export function createCmsConfig(options: CmsConfigOptions) {
  setReadAccessToken(options.readAccessToken);
  setDeploymentStatusAdapter(options.deploymentStatus);

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

  const collections: CollectionConfig[] = [Users, Media, Categories, Series, Posts, Projects].map(
    withCollectionAfterChangeHook,
  );
  const globals: GlobalConfig[] = [SiteSettings, HomePage, CvPage, BlogPage, SeriesPage, ProjectsPage, NotFoundPage].map(
    withGlobalAfterChangeHook,
  );

  return buildConfig({
    editor: createBasicRichTextEditor(),
    serverURL: options.serverURL,
    email: options.email,
    admin: {
      user: Users.slug,
      components: {
        afterNavLinks: ["./components/admin/nav/DashboardNavLink#DashboardNavLink"],
        beforeDashboard: ["./components/admin/OgGeneratorCard#OgGeneratorCard"],
        views: {
          dashboard: {
            Component: "./components/admin/Dashboard#DashboardView",
          },
        },
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    routes: {
      admin: "/",
    },
    endpoints: [generateOgImagesEndpoint(options.siteUrl)],
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
        fields: withRequiredSeoFields,
      }),
      ...(options.storagePlugins ?? []),
    ],
    db: options.db,
    secret: options.secret,
    typescript: {
      outputFile: path.resolve(dirname, "payload-types.ts"),
    },
  });
}
