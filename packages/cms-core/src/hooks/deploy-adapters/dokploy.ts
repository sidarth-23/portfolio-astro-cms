import type { Logger, PreDeployHook } from "../triggerDeployment";

export type DokployPreDeployConfig = {
  apiUrl: string;
  apiKey: string;
  composeId: string;
};

type DokployComposeResponse = {
  env?: string;
};

export function createDokployPreDeployHook(config: DokployPreDeployConfig): PreDeployHook {
  return {
    async bustBuildCache(logger: Logger, meta) {
      const normalizedApiUrl = config.apiUrl.replace(/\/$/, "");

      let currentEnv: string;
      try {
        const getResponse = await fetch(
          `${normalizedApiUrl}/api/compose.one?composeId=${encodeURIComponent(config.composeId)}`,
          {
            headers: { Authorization: `Bearer ${config.apiKey}` },
            signal: AbortSignal.timeout(10000),
          },
        );

        if (!getResponse.ok) {
          logger.error({
            message: "Failed to read compose env from Dokploy",
            status: getResponse.status,
            statusText: getResponse.statusText,
            ...meta,
          });
          return;
        }

        const compose = (await getResponse.json()) as DokployComposeResponse;
        currentEnv = compose.env ?? "";
      } catch (error) {
        logger.error({ message: "Error reading compose env from Dokploy", error, ...meta });
        return;
      }

      // Replace or append CACHE_BUST line
      const timestamp = String(Date.now());
      const bustKey = "CACHE_BUST";
      const lines = currentEnv === "" ? [] : currentEnv.split("\n");
      const existingIndex = lines.findIndex((l) => l.startsWith(`${bustKey}=`));
      const newLine = `${bustKey}=${timestamp}`;
      const updatedLines =
        existingIndex >= 0
          ? lines.map((l, i) => (i === existingIndex ? newLine : l))
          : [...lines, newLine];
      const updatedEnv = updatedLines.join("\n");

      try {
        const saveResponse = await fetch(`${normalizedApiUrl}/api/compose.saveEnvironment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({ composeId: config.composeId, env: updatedEnv }),
          signal: AbortSignal.timeout(10000),
        });

        if (!saveResponse.ok) {
          logger.error({
            message: "Failed to save CACHE_BUST to Dokploy compose env",
            status: saveResponse.status,
            statusText: saveResponse.statusText,
            ...meta,
          });
          return;
        }

        logger.info({
          message: "Updated CACHE_BUST in Dokploy compose env",
          cacheBust: timestamp,
          ...meta,
        });
      } catch (error) {
        logger.error({ message: "Error saving CACHE_BUST to Dokploy compose env", error, ...meta });
      }
    },
  };
}
