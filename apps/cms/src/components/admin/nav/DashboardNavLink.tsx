"use client";

import { usePathname } from "next/navigation";
import { Link, NavGroup, useConfig } from "@payloadcms/ui";

export function DashboardNavLink() {
  const pathname = usePathname();
  const { config } = useConfig();
  const adminRoute = config.routes.admin.replace(/\/+$/, "");
  const homePath = adminRoute || "/";
  const checklistPath = `${homePath}/setup-checklist`;
  const isHome = pathname === homePath || (homePath === "/" && pathname === "");
  const isChecklist = pathname === checklistPath;

  return (
    <NavGroup label="Dashboard">
      <Link className={`nav__link${isHome ? " active" : ""}`} href={homePath}>
        {isHome && <div className="nav__link-indicator" />}
        <span className="nav__link-label">Home</span>
      </Link>
      <Link className={`nav__link${isChecklist ? " active" : ""}`} href={checklistPath}>
        {isChecklist && <div className="nav__link-indicator" />}
        <span className="nav__link-label">Setup Checklist</span>
      </Link>
    </NavGroup>
  );
}
