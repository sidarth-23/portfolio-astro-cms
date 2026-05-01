export type DeploymentStatus = "deployed" | "building" | "failed" | "unknown";

export type DeploymentStatusResult = {
  status: DeploymentStatus;
  lastDeployedAt: Date | null;
  deployUrl: string | null;
};

export type DeploymentStatusAdapter = {
  getStatus(): Promise<DeploymentStatusResult>;
};

export type AdapterFactory<TConfig> = (config: TConfig) => DeploymentStatusAdapter;
export type AdapterValidator<TConfig> = (config: TConfig) => boolean;
export type AdapterConnectionCheckResult = {
  ok: boolean;
  message?: string;
};
export type AdapterConnectionChecker<TConfig> = (
  config: TConfig,
) => Promise<AdapterConnectionCheckResult>;

export interface DeploymentAdapterDefinition<TConfig> {
  label: string;
  createAdapter(config: TConfig): DeploymentStatusAdapter;
  isConfigValid?(config: TConfig): boolean;
  checkConnection?(config: TConfig): Promise<AdapterConnectionCheckResult>;
}

export type DeploymentAdapterRegistry = Record<string, DeploymentAdapterDefinition<object>>;

export type AdapterConfigFor<
  TRegistry extends DeploymentAdapterRegistry,
  TProvider extends keyof TRegistry,
> = TRegistry[TProvider] extends DeploymentAdapterDefinition<infer TConfig> ? TConfig : never;

type RegistryProvider<TRegistry extends DeploymentAdapterRegistry> = Exclude<
  keyof TRegistry,
  "custom"
>;

type ProviderOption<TRegistry extends DeploymentAdapterRegistry> = {
  [TProvider in RegistryProvider<TRegistry>]: {
    enabled?: true;
    provider: TProvider;
    config: AdapterConfigFor<TRegistry, TProvider>;
  };
}[RegistryProvider<TRegistry>];

type CustomProviderOption = {
  enabled?: true;
  provider: "custom";
  adapter: DeploymentStatusAdapter;
};

type DisabledOption = {
  enabled: false;
};

export type DeploymentLogViewPluginOptions<TRegistry extends DeploymentAdapterRegistry> =
  | DisabledOption
  | ProviderOption<TRegistry>
  | CustomProviderOption;

export type DeploymentStatusResponse = {
  configured: boolean;
  misconfigured: boolean;
  providerLabel: string | null;
  connectionOk: boolean | null;
  message: string | null;
  status: DeploymentStatus;
  lastDeployedAt: string | null;
  deployUrl: string | null;
};
