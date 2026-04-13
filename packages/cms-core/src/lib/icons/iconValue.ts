type SimpleIconValue = {
  source: "simple-icons";
  slug: string;
};

type PhosphorIconValue = {
  source: "phosphor";
  name: string;
};

export type ParsedIconValue = SimpleIconValue | PhosphorIconValue;

export const parseIconValueStrict = (value: unknown): ParsedIconValue | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("si:")) {
    const slug = trimmed.slice(3).trim();
    if (!slug) {
      return null;
    }

    return {
      source: "simple-icons",
      slug,
    };
  }

  if (trimmed.startsWith("ph:")) {
    const name = trimmed.slice(3).trim();
    if (!name) {
      return null;
    }

    return {
      source: "phosphor",
      name,
    };
  }

  return null;
};
