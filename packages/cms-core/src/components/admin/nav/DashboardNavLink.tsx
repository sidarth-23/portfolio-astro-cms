"use client";

import { usePathname } from "next/navigation";
import { Link, NavGroup } from "@payloadcms/ui";

export function DashboardNavLink() {
  const pathname = usePathname();
  const isActive = pathname === "/" || pathname === "";

  return (
    <NavGroup label="Dashboard">
      <Link className={`nav__link${isActive ? " active" : ""}`} href="/">
        {isActive && <div className="nav__link-indicator" />}
        <span className="nav__link-label">Home</span>
      </Link>
    </NavGroup>
  );
}
