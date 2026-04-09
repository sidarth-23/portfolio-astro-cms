type RowLabelArgs = {
  label?: string;
  noun: string;
  rowNumber?: number;
};

export const getTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

export const formatRowLabel = ({ label, noun, rowNumber }: RowLabelArgs): string => {
  const index = typeof rowNumber === "number" ? rowNumber + 1 : 1;

  if (!label) {
    return `${index}. ${noun}`;
  }

  return `${index}. ${label}`;
};
