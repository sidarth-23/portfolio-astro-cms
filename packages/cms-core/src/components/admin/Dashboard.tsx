import type { AdminViewServerProps } from "payload";

import { getShowDeploymentStatusCard, getDeploymentHookType } from "../../builder";
import { DeploymentStatusCard } from "./DeploymentStatusCard";
import { OgGeneratorCard } from "./OgGeneratorCard";

export function DashboardView(_props: AdminViewServerProps) {
  const showDeployment = getShowDeploymentStatusCard();
  const hookType = getDeploymentHookType();

  return (
    <div style={{ padding: "32px", maxWidth: "860px" }}>
      <h2
        style={{
          margin: "0 0 28px 0",
          fontSize: "22px",
          fontWeight: 700,
          color: "var(--theme-text)",
        }}
      >
        Dashboard
      </h2>
      <OgGeneratorCard />
      {showDeployment && (
        <>
          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--theme-elevation-150)",
              margin: "28px 0",
            }}
          />
          <DeploymentStatusCard hookType={hookType} />
        </>
      )}
    </div>
  );
}
