import type { AstroIntegration } from "astro";

export function devRefresh(): AstroIntegration {
  return {
    name: "sidshub:dev-refresh",
    hooks: {
      "astro:server:setup": ({ server, logger }) => {
        server.middlewares.use("/_dev/refresh", (req, res) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }

          // Emit file-change events on .astro pages to trigger Astro's
          // full HMR pipeline — this clears the route cache (getStaticPaths
          // results) which plain module-graph invalidation does not reach.
          for (const mod of server.moduleGraph.idToModuleMap.values()) {
            if (mod.file?.endsWith(".astro")) {
              server.watcher.emit("change", mod.file);
            }
          }

          logger.info("CMS content changed — reloading browser");

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        });
      },
    },
  };
}
