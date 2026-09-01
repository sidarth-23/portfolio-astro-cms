import type { AdminViewServerProps } from "payload";
import { OgGeneratorCard } from "@sidshub/cms-plugin-og-image/ui";

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
    </div>
  );
}
