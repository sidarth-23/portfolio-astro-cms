import { withPayload } from "@payloadcms/next/withPayload";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const lexicalPath = require.resolve("lexical");

/** @type {import("next").NextConfig} */
const nextConfig = {
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
