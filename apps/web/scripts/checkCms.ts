const API_BASE = (process.env.ASTRO_CMS_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
const HEALTH_URL = `${API_BASE}/health`;
const READ_TOKEN = process.env.ASTRO_CMS_READ_TOKEN;
const timeoutMs = Number(process.env.ASTRO_CMS_HEALTH_TIMEOUT_MS || 8000);

const responseSnippet = (value: string): string => {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
};

const controller = new AbortController();
const timeout = setTimeout(() => {
  controller.abort();
}, timeoutMs);

try {
  const headers: HeadersInit = {};
  if (READ_TOKEN) {
    headers.Authorization = `Bearer ${READ_TOKEN}`;
  }

  const response = await fetch(HEALTH_URL, {
    method: "GET",
    headers,
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
