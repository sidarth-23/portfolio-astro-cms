"use client";

import { usePathname } from "next/navigation";
import { Link, NavGroup } from "@payloadcms/ui";

export function DashboardNavLink() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";
  const isChecklist = pathname === "/setup-checklist";

  return (
    <NavGroup label="Dashboard">
      <Link className={`nav__link${isHome ? " active" : ""}`} href="/">
        {isHome && <div className="nav__link-indicator" />}
        <span className="nav__link-label">Home</span>
      </Link>
      <Link className={`nav__link${isChecklist ? " active" : ""}`} href="/setup-checklist">
        {isChecklist && <div className="nav__link-indicator" />}
        <span className="nav__link-label">Setup Checklist</span>
      </Link>
    </NavGroup>
  );
}
