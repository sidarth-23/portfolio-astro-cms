import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import type { ViteDevServer } from "vite";

// Workspace package dist directories to watch for changes during dev.
// When tsdown rebuilds a package, Astro's SSR module cache needs explicit
// invalidation because server-side imports bypass Vite's HMR pipeline.
const WORKSPACE_DIST_GLOBS = [
  fileURLToPath(new URL("../../../../../packages/cms-core/dist/**", import.meta.url)),
  fileURLToPath(new URL("../../../../../packages/cms-editor/dist/**", import.meta.url)),
];

function invalidateAstroModules(server: ViteDevServer) {
  for (const mod of server.moduleGraph.idToModuleMap.values()) {
    if (mod.file?.endsWith(".astro")) {
      server.watcher.emit("change", mod.file);
    }
  }
}

export function devRefresh(): AstroIntegration {
  return {
    name: "sidshub:dev-refresh",
    hooks: {
      "astro:server:setup": ({ server, logger }) => {
        // Watch workspace package dist dirs so SSR modules invalidate when
        // tsdown rebuilds a package in watch mode.
        server.watcher.add(WORKSPACE_DIST_GLOBS);
        server.watcher.on("change", (changedPath) => {
          const isWorkspaceDist = WORKSPACE_DIST_GLOBS.some(
            () => changedPath.includes("/packages/") && changedPath.includes("/dist/"),
          );
          if (isWorkspaceDist) {
            logger.info(`Package changed: ${changedPath} — invalidating modules`);
            invalidateAstroModules(server);
          }
        });

        server.middlewares.use("/_dev/refresh", (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }

          // Emit file-change events on .astro pages to trigger Astro's
          // full HMR pipeline — this clears the route cache (getStaticPaths
          // results) which plain module-graph invalidation does not reach.
          invalidateAstroModules(server);

          logger.info("CMS content changed — reloading browser");

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        });
      },
    },
  };
}
