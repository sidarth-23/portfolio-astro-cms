type TriggerMeta = Record<string, string | number | undefined>;

export type Logger = {
  info: (value: Record<string, unknown>) => void;
  error: (value: Record<string, unknown>) => void;
};

export type PreDeployHook = {
  bustBuildCache: (logger: Logger, meta: TriggerMeta) => Promise<void>;
};

type DeployConfig = { webhookUrl: string; branch: string; preDeploy?: PreDeployHook };

const buildBodySnippet = (body: string): string => {
  return body.replace(/\s+/g, " ").trim().slice(0, 240);
};

export function createTriggerDeployment(config?: DeployConfig) {
  return async (logger: Logger, meta: TriggerMeta): Promise<void> => {
    if (!config) {
      logger.error({
        message:
          "Deployment trigger is not configured. Missing WEB_DEPLOY_WEBHOOK_URL or WEB_DEPLOY_BRANCH.",
        ...meta,
      });
      return;
    }

    const { webhookUrl, branch: deployBranch } = config;

    if (config.preDeploy) {
      try {
        await config.preDeploy.bustBuildCache(logger, meta);
      } catch (error) {
        logger.error({ message: "Pre-deploy hook threw unexpectedly", error, ...meta });
      }
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-github-event": "push",
        },
        body: JSON.stringify({
          ref: `refs/heads/${deployBranch}`,
          commits: [{ modified: ["apps/web/content-trigger"] }],
        }),
      });

      const responseBody = await response.text();
      const bodySnippet = buildBodySnippet(responseBody);

      if (!response.ok) {
        logger.error({
          message: "Deployment trigger returned non-OK response",
          status: response.status,
          statusText: response.statusText,
          bodySnippet,
          ...meta,
        });
        return;
      }

      logger.info({
        message: "Triggered web deployment webhook",
        status: response.status,
        statusText: response.statusText,
        bodySnippet,
        deployBranch,
        ...meta,
      });
    } catch (error) {
      logger.error({
        message: "Failed to trigger web deployment webhook",
        error,
        deployBranch,
        ...meta,
      });
    }
  };
}
