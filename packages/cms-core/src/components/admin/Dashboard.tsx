import { DefaultDashboard, type DashboardViewServerProps } from "@payloadcms/next/views";

import { OgGeneratorCard } from "./OgGeneratorCard";

export function DashboardView(props: DashboardViewServerProps) {
  return (
    <>
      <OgGeneratorCard />
      <DefaultDashboard {...props} />
    </>
  );
}
