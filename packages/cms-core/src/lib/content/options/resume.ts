import { defineOptions } from "./utils";

export const RESUME_URL_TYPE_OPTIONS = defineOptions([
  { label: "Google Drive", value: "google" },
  { label: "Custom Link", value: "custom" },
]);

export type ResumeUrlType = (typeof RESUME_URL_TYPE_OPTIONS)[number]["value"];
