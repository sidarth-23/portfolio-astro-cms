export type DeploymentStatus = 'deployed' | 'building' | 'failed' | 'unknown'

export type DeploymentStatusResult = {
  status: DeploymentStatus
  lastDeployedAt: Date | null
  deployUrl: string | null
}

export interface DeploymentStatusAdapter {
  getStatus(): Promise<DeploymentStatusResult>
}
