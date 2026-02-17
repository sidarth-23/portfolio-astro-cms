import { DefaultDashboard, type DashboardViewServerProps } from "@payloadcms/next/views";

export function DashboardView(props: DashboardViewServerProps) {
  return (
      <DefaultDashboard {...props} />
  );
}
