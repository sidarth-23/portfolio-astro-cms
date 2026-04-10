import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { basename, extname } from "node:path";

const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "metadata.google.internal.",
]);

const CONTENT_TYPE_EXTENSION_MAP: Record<string, string> = {
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/svg+xml": ".svg",
  "image/webp": ".webp",
};

const sanitizeFilename = (input: string): string => {
  const sanitized = input.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").trim();
  if (!sanitized.length) {
    return "remote-image";
  }

  return sanitized;
};

const isPrivateIPv4 = (address: string): boolean => {
  const octets = address.split(".").map((segment) => Number.parseInt(segment, 10));
  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)) {
    return true;
  }

  const [a, b] = octets;
  if (a === 0 || a === 10 || a === 127) {
    return true;
  }
  if (a === 100 && b >= 64 && b <= 127) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  if (a === 192 && b === 0 && octets[2] === 0) {
    return true;
  }
  if (a === 192 && b === 0 && octets[2] === 2) {
    return true;
  }
  if (a === 198 && (b === 18 || b === 19)) {
    return true;
  }
  if (a === 198 && b === 51 && octets[2] === 100) {
    return true;
  }
  if (a === 203 && b === 0 && octets[2] === 113) {
    return true;
  }
  if (a >= 224) {
    return true;
  }

  return false;
};

const isPrivateIPv6 = (address: string): boolean => {
  const normalized = address.toLowerCase();

  if (normalized === "::" || normalized === "::1") {
    return true;
  }
  if (normalized.startsWith("fe80:") || normalized.startsWith("fe90:") || normalized.startsWith("fea0:") || normalized.startsWith("feb0:")) {
    return true;
  }
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }
  if (normalized.startsWith("ff")) {
    return true;
  }
  if (normalized.startsWith("2001:db8:")) {
    return true;
  }

  if (normalized.startsWith("::ffff:")) {
    const maybeIPv4 = normalized.slice(7);
    return isPrivateIPv4(maybeIPv4);
  }

  return false;
};

const assertPublicIpAddress = (address: string): void => {
  const version = isIP(address);
  if (version === 4 && isPrivateIPv4(address)) {
    throw new Error("Remote URL resolves to a private IPv4 address.");
  }

  if (version === 6 && isPrivateIPv6(address)) {
    throw new Error("Remote URL resolves to a private IPv6 address.");
  }

  if (version === 0) {
    throw new Error("Remote URL resolved to an invalid IP address.");
  }
};

const assertSafeHostname = async (hostname: string): Promise<void> => {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized.length) {
    throw new Error("Remote URL hostname is required.");
  }

  if (BLOCKED_HOSTNAMES.has(normalized) || normalized.endsWith(".localhost")) {
    throw new Error("Remote URL hostname is not allowed.");
  }

  if (isIP(normalized)) {
    assertPublicIpAddress(normalized);
    return;
  }

  const dnsResults = await lookup(normalized, { all: true, verbatim: true });
  if (!dnsResults.length) {
    throw new Error("Remote URL hostname could not be resolved.");
  }

  dnsResults.forEach((result) => {
    assertPublicIpAddress(result.address);
  });
};

const assertSafeUrl = async (url: URL): Promise<void> => {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed.");
  }

  await assertSafeHostname(url.hostname);
};

const getExtensionFromContentType = (contentType: string): string => {
  const normalizedType = contentType.toLowerCase().split(";")[0].trim();
  return CONTENT_TYPE_EXTENSION_MAP[normalizedType] || ".img";
};

const getSafeFilename = (url: URL, contentType: string): string => {
  const fallbackExtension = getExtensionFromContentType(contentType);
  let decodedPathname = url.pathname;

  try {
    decodedPathname = decodeURIComponent(url.pathname);
  } catch {
    decodedPathname = url.pathname;
  }

  const urlFilename = sanitizeFilename(basename(decodedPathname));
  const urlExtension = extname(urlFilename);
  const filenameWithoutExt = urlExtension ? urlFilename.slice(0, -urlExtension.length) : urlFilename;

  if (!filenameWithoutExt.length) {
    return `remote-image${fallbackExtension}`;
  }

  if (!urlExtension.length) {
    return `${filenameWithoutExt}${fallbackExtension}`;
  }

  return `${filenameWithoutExt}${urlExtension.toLowerCase()}`;
};

const concatUint8Arrays = (chunks: Uint8Array[], totalLength: number): Uint8Array => {
  const output = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  });

  return output;
};

const readBodyWithLimit = async (response: Response): Promise<Uint8Array> => {
  if (!response.body) {
    throw new Error("Remote server returned an empty response body.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    totalBytes += value.byteLength;
    if (totalBytes > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error(`Remote file exceeds the ${MAX_IMAGE_BYTES} byte limit.`);
    }

    chunks.push(value);
  }

  return concatUint8Arrays(chunks, totalBytes);
};

export const fetchRemoteImage = async (
  inputUrl: string,
): Promise<{ data: Uint8Array; finalUrl: URL; filename: string }> => {
  let currentUrl = new URL(inputUrl);
  await assertSafeUrl(currentUrl);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "image/*",
          "User-Agent": "sidshub-cms-media-importer/1.0",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          throw new Error("Remote URL redirect is missing a location header.");
        }

        if (redirectCount === MAX_REDIRECTS) {
          throw new Error("Remote URL exceeded redirect limit.");
        }

        currentUrl = new URL(location, currentUrl);
        await assertSafeUrl(currentUrl);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Remote URL returned status ${response.status}.`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().startsWith("image/")) {
        throw new Error("Remote URL did not return an image content type.");
      }

      const contentLengthHeader = response.headers.get("content-length");
      if (contentLengthHeader) {
        const contentLength = Number.parseInt(contentLengthHeader, 10);
        if (!Number.isNaN(contentLength) && contentLength > MAX_IMAGE_BYTES) {
          throw new Error(`Remote file exceeds the ${MAX_IMAGE_BYTES} byte limit.`);
        }
      }

      const data = await readBodyWithLimit(response);
      const filename = getSafeFilename(currentUrl, contentType);

      return {
        data,
        finalUrl: currentUrl,
        filename,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Remote image request timed out.");
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("Remote URL could not be fetched.");
};
