import type { DeploymentStatusAdapter, DeploymentStatusResult } from './types'

type DokployConfig = {
  apiUrl: string
  apiKey: string
  applicationId: string
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
      const parsed = data.createdAt ? new Date(data.createdAt) : null
      const lastDeployedAt = parsed && !isNaN(parsed.getTime()) ? parsed : null
      const deployUrl = `${apiUrl.replace(/\/$/, '')}/dashboard/project/${encodeURIComponent(applicationId)}`

      return { status, lastDeployedAt, deployUrl }
    },
  }
}
