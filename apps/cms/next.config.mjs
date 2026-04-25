import { withPayload } from "@payloadcms/next/withPayload";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const lexicalPath = require.resolve("lexical");

/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@sidshub/cms-core",
    "@sidshub/cms-feature-emoji",
    "@sidshub/cms-feature-footnotes",
    "@sidshub/cms-feature-markdown-paste",
    "@sidshub/cms-lib-editor",
    "@sidshub/cms-lib-icons",
    "@sidshub/cms-plugin-deployment-log-view",
    "@sidshub/cms-plugin-og-image",
  ],
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      lexical: lexicalPath,
    };

    return config;
  },
};

export default withPayload(nextConfig);
