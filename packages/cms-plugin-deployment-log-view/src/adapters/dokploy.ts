import type {
  AdapterConnectionCheckResult,
  AdapterValidator,
  DeploymentAdapterDefinition,
  DeploymentStatus,
  DeploymentStatusAdapter,
} from "../types";

export type DokployAdapterConfig = {
  apiUrl: string;
  apiKey: string;
  applicationId: string;
  projectId?: string;
};

type DokployApplicationResponse = {
  applicationStatus?: string;
};

function getDokployApplicationStatusUrl(config: DokployAdapterConfig): string {
  const normalizedApiUrl = config.apiUrl.replace(/\/$/, "");
  return `${normalizedApiUrl}/api/application.one?applicationId=${encodeURIComponent(config.applicationId)}`;
}

function getDokployDeploymentsUrl(config: DokployAdapterConfig): string {
  const normalizedApiUrl = config.apiUrl.replace(/\/$/, "");
  return `${normalizedApiUrl}/api/deployment.all?applicationId=${encodeURIComponent(config.applicationId)}`;
}

const checkDokployConnection = async (
  config: DokployAdapterConfig,
): Promise<AdapterConnectionCheckResult> => {
  try {
    const response = await fetch(getDokployApplicationStatusUrl(config), {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return { ok: true };
    }

    if (response.status === 401 || response.status === 403) {
      return { ok: false, message: "Dokploy authentication failed. Verify API key." };
    }

    if (response.status === 404) {
      return { ok: false, message: "Dokploy application not found. Verify application ID." };
    }

    return {
      ok: false,
      message: `Dokploy connection check failed with status ${response.status}.`,
    };
  } catch {
    return { ok: false, message: "Unable to reach Dokploy API." };
  }
};

const isNonEmpty = (value: string | undefined): boolean =>
  typeof value === "string" && value.trim() !== "";

const isDokployConfigValid: AdapterValidator<DokployAdapterConfig> = (config) => {
  return isNonEmpty(config.apiUrl) && isNonEmpty(config.apiKey) && isNonEmpty(config.applicationId);
};

export function createDokployAdapter(config: DokployAdapterConfig): DeploymentStatusAdapter {
  if (!isDokployConfigValid(config)) {
    throw new Error("[deployment-log-view:dokploy] invalid config");
  }

  return {
    async getStatus() {
      const normalizedApiUrl = config.apiUrl.replace(/\/$/, "");

      let data: DokployApplicationResponse;
      try {
        const response = await fetch(getDokployApplicationStatusUrl(config), {
          headers: { Authorization: `Bearer ${config.apiKey}` },
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) {
          return { status: "unknown", lastDeployedAt: null, deployUrl: null };
        }
        data = (await response.json()) as DokployApplicationResponse;
      } catch {
        return { status: "unknown", lastDeployedAt: null, deployUrl: null };
      }

      const statusMap: Record<string, DeploymentStatus> = {
        done: "deployed",
        running: "building",
        error: "failed",
        idle: "unknown",
      };

      const status = statusMap[data.applicationStatus ?? ""] ?? "unknown";

      let lastDeployedAt: Date | null = null;
      try {
        const deploymentsResponse = await fetch(getDokployDeploymentsUrl(config), {
          headers: { Authorization: `Bearer ${config.apiKey}` },
          signal: AbortSignal.timeout(5000),
        });
        if (deploymentsResponse.ok) {
          const deployments = (await deploymentsResponse.json()) as Array<{ createdAt?: string }>;
          const latest =
            Array.isArray(deployments) && deployments.length > 0 ? deployments[0] : undefined;
          const parsedDate = latest?.createdAt ? new Date(latest.createdAt) : null;
          lastDeployedAt = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
        }
      } catch {
        lastDeployedAt = null;
      }

      const deployUrl = config.projectId
        ? `${normalizedApiUrl}/dashboard/project/${encodeURIComponent(config.projectId)}/application/${encodeURIComponent(config.applicationId)}`
        : null;

      return { status, lastDeployedAt, deployUrl };
    },
  };
}

export const dokployAdapterDefinition: DeploymentAdapterDefinition<DokployAdapterConfig> = {
  label: "Dokploy",
  createAdapter: createDokployAdapter,
  isConfigValid: isDokployConfigValid,
  checkConnection: checkDokployConnection,
};
