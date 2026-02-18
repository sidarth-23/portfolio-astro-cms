type TriggerMeta = Record<string, string | number | undefined>;

const buildBodySnippet = (body: string): string => {
  return body.replace(/\s+/g, " ").trim().slice(0, 240);
};

export const triggerDokployDeploy = async (
  logger: {
    info: (value: Record<string, unknown>) => void;
    error: (value: Record<string, unknown>) => void;
  },
  meta: TriggerMeta,
): Promise<void> => {
  const apiBaseUrl = process.env.DOKPLOY_API_URL;
  const apiKey = process.env.DOKPLOY_API_KEY;
  const composeId = process.env.DOKPLOY_COMPOSE_ID;

  if (!apiBaseUrl || !apiKey || !composeId) {
    logger.error({
      message: "Dokploy API deploy trigger is not configured. Missing DOKPLOY_API_URL, DOKPLOY_API_KEY, or DOKPLOY_COMPOSE_ID.",
      ...meta,
    });
    return;
  }

  const deployUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/compose.deploy`;

  try {
    const response = await fetch(deployUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        composeId,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error({
        message: "Dokploy API deploy trigger returned non-OK response",
        status: response.status,
        statusText: response.statusText,
        bodySnippet: buildBodySnippet(body),
        ...meta,
      });
      return;
    }

    logger.info({
      message: "Triggered Dokploy deploy via API",
      composeId,
      ...meta,
    });
  } catch (error) {
    logger.error({
      message: "Failed to trigger Dokploy deploy via API",
      error,
      composeId,
      ...meta,
    });
  }
};
