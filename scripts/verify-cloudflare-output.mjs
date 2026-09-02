import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const serverDirectory = resolve("apps/web/dist/server");
const configPath = resolve(serverDirectory, "wrangler.json");

function fail(message) {
  console.error(`Cloudflare output verification failed: ${message}`);
  process.exit(1);
}

if (!existsSync(configPath)) {
  fail(`generated config is missing: ${configPath}`);
}

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf8"));
} catch {
  fail("generated wrangler.json is not valid JSON");
}

if (config.name !== "portfolio-astro-cms") {
  fail(`generated Worker name must be portfolio-astro-cms, got ${String(config.name)}`);
}

if (typeof config.main !== "string") {
  fail("generated config must define a main entrypoint");
}
const mainPath = resolve(serverDirectory, config.main);
if (!existsSync(mainPath)) {
  fail(`Worker entrypoint does not exist: ${config.main}`);
}

if (typeof config.assets?.directory !== "string") {
  fail("generated config must define assets.directory");
}
const assetsDirectory = resolve(serverDirectory, config.assets.directory);
if (!existsSync(assetsDirectory)) {
  fail(`assets directory does not exist: ${config.assets.directory}`);
}
if (!existsSync(resolve(assetsDirectory, "index.html"))) {
  fail(`assets directory has no prerendered root document: ${config.assets.directory}`);
}

const kvBindings = new Set((config.kv_namespaces ?? []).map(({ binding }) => binding));
if (!kvBindings.has("SESSION")) {
  fail("generated config must expose SESSION in kv_namespaces");
}
if (config.images?.binding !== "IMAGES") {
  fail("generated config must expose IMAGES in images.binding");
}
if (config.assets?.binding !== "ASSETS") {
  fail("generated config must expose ASSETS in assets.binding");
}

const serializedConfig = JSON.stringify(config);
for (const obsoletePath of [".wrangler/deploy/config.json", "dist/client/ssr/wrangler.json"]) {
  if (serializedConfig.includes(obsoletePath)) {
    fail(`generated config contains obsolete path: ${obsoletePath}`);
  }
}

const assetCount = readdirSync(assetsDirectory).length;
console.log(`Cloudflare output verified: ${config.name}, main=${config.main}, assets=${config.assets.directory}, files=${assetCount}`);
