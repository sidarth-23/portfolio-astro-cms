import { withPayload } from "@payloadcms/next/withPayload";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const lexicalPath = require.resolve("lexical");

/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: ["@sidshub/cms-core", "@sidshub/cms-lib-editor"],
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
