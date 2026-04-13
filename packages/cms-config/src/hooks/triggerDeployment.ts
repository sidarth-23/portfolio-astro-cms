type TriggerMeta = Record<string, string | number | undefined>;

type DeployConfig = { webhookUrl: string; branch: string };

const buildBodySnippet = (body: string): string => {
  return body.replace(/\s+/g, " ").trim().slice(0, 240);
};

export function createTriggerDeployment(config?: DeployConfig) {
  return async (
    logger: {
      info: (value: Record<string, unknown>) => void;
      error: (value: Record<string, unknown>) => void;
    },
    meta: TriggerMeta,
  ): Promise<void> => {
    if (!config) {
      logger.error({
        message: "Deployment trigger is not configured. Missing WEB_DEPLOY_WEBHOOK_URL or WEB_DEPLOY_BRANCH.",
        ...meta,
      });
      return;
    }

    const { webhookUrl, branch: deployBranch } = config;

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
