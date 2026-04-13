import { parseIconValueStrict } from "../iconValue";
import { getSimpleIconCdnUrl } from "../simpleIconsCatalog";
import { getPhosphorIconSvgUrl } from "../phosphorIconsCatalog";

export async function fetchIconSvg(iconValue: string): Promise<string | null> {
  const parsed = parseIconValueStrict(iconValue);
  if (!parsed) return null;

  let url: string;
  if (parsed.source === "simple-icons") {
    url = getSimpleIconCdnUrl(parsed.slug, { color: "ffffff" });
  } else {
    url = getPhosphorIconSvgUrl(parsed.name);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

export async function svgToDataUri(svgContent: string): Promise<string> {
  const encoded = encodeURIComponent(svgContent);
  return `data:image/svg+xml,${encoded}`;
}
