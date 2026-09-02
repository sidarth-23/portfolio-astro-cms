import { existsSync, readFileSync, readdirSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

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

if (config.workers_dev !== true) {
  fail("generated config must enable workers_dev");
}

if (
  JSON.stringify(config.routes) !==
  JSON.stringify([{ pattern: "archive-portfolio.sidshub.in", custom_domain: true }])
) {
  fail("generated config routes must contain exactly the archive-portfolio custom domain");
}

if (config.observability?.enabled !== true) {
  fail("generated config must enable observability");
}
if (config.observability?.logs?.invocation_logs !== true) {
  fail("generated config must enable persistent invocation logs");
}
if (config.observability?.logs?.persist !== true) {
  fail("generated config must persist invocation logs");
}

if (typeof config.main !== "string") {
  fail("generated config must define a main entrypoint");
}
if (isAbsolute(config.main)) {
  fail("generated main entrypoint must be relative to dist/server");
}
const mainPath = resolve(serverDirectory, config.main);
if (!existsSync(mainPath)) {
  fail(`Worker entrypoint does not exist: ${config.main}`);
}

if (typeof config.assets?.directory !== "string") {
  fail("generated config must define assets.directory");
}
if (isAbsolute(config.assets.directory)) {
  fail("generated assets.directory must be relative to dist/server");
}
const assetsDirectory = resolve(serverDirectory, config.assets.directory);
if (!existsSync(assetsDirectory)) {
  fail(`assets directory does not exist: ${config.assets.directory}`);
}
const rootDocument = resolve(assetsDirectory, "index.html");
if (!existsSync(rootDocument)) {
  fail(`assets directory has no prerendered root document: ${config.assets.directory}`);
}
if (rootDocument !== resolve("apps/web/dist/client/index.html")) {
  fail(`assets.directory must resolve to apps/web/dist/client, got ${assetsDirectory}`);
}

if (config.assets.binding !== "ASSETS") {
  fail("generated config must expose ASSETS in assets.binding");
}
if (config.images?.binding !== "IMAGES") {
  fail("generated config must expose IMAGES in images.binding");
}

const kvBindings = new Set((config.kv_namespaces ?? []).map(({ binding }) => binding));
if (kvBindings.has("SESSION")) {
  fail("generated config must not expose SESSION in kv_namespaces");
}

const serializedConfig = JSON.stringify(config);
for (const obsoletePath of [".wrangler/deploy/config.json", "dist/client/ssr/wrangler.json"]) {
  if (serializedConfig.includes(obsoletePath)) {
    fail(`generated config contains obsolete path: ${obsoletePath}`);
  }
}

const assetCount = readdirSync(assetsDirectory).length;
console.log(
  `Cloudflare output verified: ${config.name}, main=${config.main}, assets=${config.assets.directory}, files=${assetCount}`,
);
