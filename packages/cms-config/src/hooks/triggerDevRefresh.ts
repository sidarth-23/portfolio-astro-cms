type TriggerMeta = Record<string, string | number | undefined>;

export const triggerDevRefresh = async (
  logger: {
    info: (value: Record<string, unknown>) => void;
    error: (value: Record<string, unknown>) => void;
  },
  meta: TriggerMeta,
): Promise<void> => {
  const devRefreshUrl = process.env.WEB_DEV_REFRESH_URL;

  if (!devRefreshUrl) {
    return;
  }

  try {
    const response = await fetch(devRefreshUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meta),
    });

    if (!response.ok) {
      logger.error({
        message: "Dev refresh returned non-OK response",
        status: response.status,
        ...meta,
      });
      return;
    }

    logger.info({
      message: "Triggered dev refresh",
      ...meta,
    });
  } catch {
    logger.info({
      message: "Dev refresh skipped (web dev server not reachable)",
      ...meta,
    });
  }
};
