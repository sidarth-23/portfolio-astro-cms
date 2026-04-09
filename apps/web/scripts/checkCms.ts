const apiUrl = process.env.ASTRO_CMS_API_URL;
if (!apiUrl) {
  console.error("[check:cms] Missing required environment variable: ASTRO_CMS_API_URL");
  process.exit(1);
}

const readToken = process.env.ASTRO_CMS_READ_TOKEN;
if (!readToken) {
  console.error("[check:cms] Missing required environment variable: ASTRO_CMS_READ_TOKEN");
  process.exit(1);
}

const API_BASE = apiUrl.replace(/\/$/, "");
const HEALTH_URL = `${API_BASE}/health`;

const timeoutValue = process.env.ASTRO_CMS_HEALTH_TIMEOUT_MS;
const parsedTimeoutMs = timeoutValue ? Number(timeoutValue) : undefined;
const timeoutMs =
  typeof parsedTimeoutMs === "number" && Number.isInteger(parsedTimeoutMs) && parsedTimeoutMs > 0
    ? parsedTimeoutMs
    : 8000;

const responseSnippet = (value: string): string => {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
};

const controller = new AbortController();
const timeout = setTimeout(() => {
  controller.abort();
}, timeoutMs);

try {
  const response = await fetch(HEALTH_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${readToken}`,
    },
    signal: controller.signal,
  });

  const rawBody = await response.text();
  const snippet = rawBody ? responseSnippet(rawBody) : "";

  if (!response.ok) {
    const details = snippet ? ` Response: ${snippet}` : "";
    throw new Error(
      `CMS health check failed at ${HEALTH_URL} with status ${response.status} ${response.statusText}.${details}`,
    );
  }

  console.log(`[check:cms] CMS reachable: ${HEALTH_URL}`);
} catch (error) {
  const message =
    error instanceof Error
      ? error.name === "AbortError"
        ? `CMS health check timed out after ${timeoutMs}ms at ${HEALTH_URL}`
        : `CMS health check failed at ${HEALTH_URL}: ${error.message}`
      : String(error);
  console.error(`[check:cms] ${message}`);
  process.exit(1);
} finally {
  clearTimeout(timeout);
}

export {};
