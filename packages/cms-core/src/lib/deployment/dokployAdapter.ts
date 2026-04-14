import type { DeploymentStatusAdapter, DeploymentStatusResult } from './types'

type DokployConfig = {
  apiUrl: string
  apiKey: string
  applicationId: string
  projectId?: string
}

type DokployApplicationResponse = {
  applicationStatus?: string
  createdAt?: string
}

export function dokployAdapter(config: DokployConfig): DeploymentStatusAdapter {
  if (!config.apiUrl.trim()) throw new Error('[dokployAdapter] apiUrl must not be empty')
  if (!config.apiKey.trim()) throw new Error('[dokployAdapter] apiKey must not be empty')
  if (!config.applicationId.trim()) throw new Error('[dokployAdapter] applicationId must not be empty')

  return {
    async getStatus(): Promise<DeploymentStatusResult> {
      const { apiUrl, apiKey, applicationId } = config
      const url = `${apiUrl.replace(/\/$/, '')}/api/application.one?applicationId=${encodeURIComponent(applicationId)}`

      let data: DokployApplicationResponse
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(5000),
        })
        if (!response.ok) {
          return { status: 'unknown', lastDeployedAt: null, deployUrl: null }
        }
        data = (await response.json()) as DokployApplicationResponse
      } catch {
        return { status: 'unknown', lastDeployedAt: null, deployUrl: null }
      }

      const statusMap: Record<string, 'deployed' | 'building' | 'failed' | 'unknown'> = {
        done: 'deployed',
        running: 'building',
        error: 'failed',
        idle: 'unknown',
      }

      const status = statusMap[data.applicationStatus ?? ''] ?? 'unknown'

      // Fetch latest deployment timestamp from deployment history
      let lastDeployedAt: Date | null = null;
      try {
        const deploymentsUrl = `${apiUrl.replace(/\/$/, '')}/api/deployment.all?applicationId=${encodeURIComponent(applicationId)}`;
        const depRes = await fetch(deploymentsUrl, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(5000),
        });
        if (depRes.ok) {
          const deployments = (await depRes.json()) as Array<{ createdAt?: string }>;
          if (Array.isArray(deployments) && deployments.length > 0) {
            // Deployments are returned newest-first; take the first
            const latest = deployments[0];
            const parsed = latest.createdAt ? new Date(latest.createdAt) : null;
            lastDeployedAt = parsed && !isNaN(parsed.getTime()) ? parsed : null;
          }
        }
      } catch {
        // silently ignore — lastDeployedAt stays null
      }

      const deployUrl =
        config.projectId
          ? `${apiUrl.replace(/\/$/, '')}/dashboard/project/${encodeURIComponent(config.projectId)}/application/${encodeURIComponent(applicationId)}`
          : null;

      return { status, lastDeployedAt, deployUrl }
    },
  }
}
