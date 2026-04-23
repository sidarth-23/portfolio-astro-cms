import type { AdminViewServerProps } from "payload";
import { DeploymentStatusCard } from "@sidshub/cms-plugin-deployment-log-view/ui";

import { OgGeneratorCard } from "./OgGeneratorCard";

export function DashboardView(_props: AdminViewServerProps) {
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
      <hr
        style={{
          border: "none",
          borderTop: "1px solid var(--theme-elevation-150)",
          margin: "28px 0",
        }}
      />
      <DeploymentStatusCard />
    </div>
  );
}
