type UnknownRecord = Record<string, unknown>;

type HookArgs = {
  data?: unknown;
};

const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === "object" && value !== null;
};

const sanitizeItem = (item: unknown): unknown => {
  if (!isRecord(item)) {
    return item;
  }

  const next: UnknownRecord = { ...item };

  if (next.subtitle === null) {
    next.subtitle = undefined;
  }
  if (next.organization === null) {
    next.organization = undefined;
  }
  if (next.location === null) {
    next.location = undefined;
  }
  if (next.url === null) {
    next.url = undefined;
  }

  return next;
};

const sanitizeSection = (section: unknown): unknown => {
  if (!isRecord(section)) {
    return section;
  }

  const next: UnknownRecord = { ...section };

  if (next.items === 0) {
    next.items = undefined;
  }
  if (next.badgeGroups === 0) {
    next.badgeGroups = undefined;
  }

  if (Array.isArray(next.items)) {
    next.items = next.items.map(sanitizeItem);
  }

  return next;
};

export const sanitizeCvPageBeforeValidate = ({ data }: HookArgs): unknown => {
  if (!isRecord(data)) {
    return data;
  }

  const next: UnknownRecord = { ...data };

  if (Array.isArray(next.sections)) {
    next.sections = next.sections.map(sanitizeSection);
  }

  return next;
};
