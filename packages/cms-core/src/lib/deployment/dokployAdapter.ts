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
  return {
    async getStatus(): Promise<DeploymentStatusResult> {
      const { apiUrl, apiKey, applicationId } = config
      const url = `${apiUrl.replace(/\/$/, '')}/api/application.one?applicationId=${encodeURIComponent(applicationId)}`

      let data: DokployApplicationResponse
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}` },
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
      }

      const status = statusMap[data.applicationStatus ?? ''] ?? 'unknown'
      const lastDeployedAt = data.createdAt ? new Date(data.createdAt) : null
      const deployUrl = `${apiUrl.replace(/\/$/, '')}/dashboard/project/${encodeURIComponent(applicationId)}`

      return { status, lastDeployedAt, deployUrl }
    },
  }
}
