import type { Field } from "payload";

type IconPickerFieldArgs = {
  name?: string;
  label?: string;
};

export const iconPickerField = ({
  name = "icon",
  label = "Icon",
}: IconPickerFieldArgs = {}): Field => ({
  name,
  label,
  type: "text",
  admin: {
    components: {
      Field: "@sidshub/cms-icons/ui#IconPickerField",
    },
  },
});
