import { withPayload } from "@payloadcms/next/withPayload";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const lexicalPath = require.resolve("lexical");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@sidshub/icon-catalog"],
  // Required for monorepo: traces files from the repo root so workspace
  // packages are included in the standalone output
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
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
