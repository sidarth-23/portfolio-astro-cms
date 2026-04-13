import type { z } from "zod";

const formatPath = (path: Array<string | number>): string => {
  if (path.length === 0) {
    return "root";
  }

  return path
    .map((segment) => (typeof segment === "number" ? `[${segment}]` : segment))
    .join(".")
    .replace(/\.\[/g, "[");
};

const formatZodError = (error: z.ZodError, prefix?: string): string => {
  const details = error.issues.map((issue) => `${formatPath(issue.path)}: ${issue.message}`).join("; ");
  return prefix ? `${prefix} ${details}` : details;
};

type HookArgs = {
  data?: unknown;
  context?: Record<string, unknown>;
};

export const createPayloadDataSchemaHook = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  options?: { errorPrefix?: string },
) => {
  return ({ data, context }: HookArgs) => {
    if (context?.skipDataValidation) {
      return data;
    }

    const parsed = schema.safeParse(data ?? {});
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error, options?.errorPrefix));
    }

    return parsed.data;
  };
};
