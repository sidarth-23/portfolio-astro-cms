import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import type { ViteDevServer } from "vite";

// Workspace package dist directories to watch for changes during dev.
// When tsdown rebuilds a package, Astro's SSR module cache needs explicit
// invalidation because server-side imports bypass Vite's HMR pipeline.
const WORKSPACE_DIST_GLOBS = [
  fileURLToPath(new URL("../../../../../packages/cms-core/dist/**", import.meta.url)),
  fileURLToPath(new URL("../../../../../packages/cms-lib-editor/dist/**", import.meta.url)),
  fileURLToPath(new URL("../../../../../packages/cms-lib-icons/dist/**", import.meta.url)),
];

/**
 * Directly invalidate all .astro modules in the SSR module graph without
 * emitting watcher events (avoids [watch] log spam). Returns the count of
 * invalidated modules. Callers must send a browser reload separately.
 */
function invalidateAstroModules(server: ViteDevServer): number {
  let count = 0;
  for (const mod of server.moduleGraph.idToModuleMap.values()) {
    if (mod.file?.endsWith(".astro")) {
      server.moduleGraph.invalidateModule(mod);
      count++;
    }
  }
  return count;
}

export function devRefresh(): AstroIntegration {
  return {
    name: "sidshub:dev-refresh",
    hooks: {
      "astro:server:setup": ({ server, logger }) => {
        // --- Workspace dist watcher (debounced) ---
        // Real dist file changes already trigger Astro's rebuildManifest
        // (route cache clearing) via its own watcher handler, so no synthetic
        // change events are needed here — just quiet module invalidation.
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        let pendingChanges: string[] = [];

        server.watcher.add(WORKSPACE_DIST_GLOBS);
        server.watcher.on("change", (changedPath) => {
          const isWorkspaceDist =
            changedPath.includes("/packages/") && changedPath.includes("/dist/");
          if (!isWorkspaceDist) return;

          pendingChanges.push(changedPath);

          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            const fileCount = pendingChanges.length;
            pendingChanges = [];
            debounceTimer = null;

            const modCount = invalidateAstroModules(server);
            logger.info(
              `Package rebuild (${fileCount} file${fileCount !== 1 ? "s" : ""}) — invalidated ${modCount} module${modCount !== 1 ? "s" : ""}`,
            );
            server.ws.send({ type: "full-reload", path: "*" });
          }, 300);
        });

        // --- CMS content refresh endpoint ---
        server.middlewares.use("/_dev/refresh", (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }

          // Invalidate all .astro modules quietly (no [watch] log per module).
          const modCount = invalidateAstroModules(server);

          // Emit ONE synthetic change event to trigger Astro's rebuildManifest,
          // which clears the route cache (getStaticPaths results). A real file
          // change event is the only external way to reach that code path.
          for (const mod of server.moduleGraph.idToModuleMap.values()) {
            if (mod.file?.endsWith(".astro")) {
              server.watcher.emit("change", mod.file);
              break;
            }
          }

          server.ws.send({ type: "full-reload", path: "*" });
          logger.info(`CMS content changed — invalidated ${modCount} modules, reloading browser`);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        });
      },
    },
  };
}
