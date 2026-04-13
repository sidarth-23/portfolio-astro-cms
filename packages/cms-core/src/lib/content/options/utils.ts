export type SelectOption<TValue extends string = string> = {
  label: string;
  value: TValue;
};

export const defineOptions = <TValue extends string>(options: SelectOption<TValue>[]): SelectOption<TValue>[] => {
  return options;
};
