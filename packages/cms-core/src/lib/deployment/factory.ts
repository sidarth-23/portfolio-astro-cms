export type HookType = "dokploy";

export type HookConfig = {
  type: "dokploy";
  apiUrl: string;
  apiKey: string;
  applicationId: string;
  projectId?: string;
};
