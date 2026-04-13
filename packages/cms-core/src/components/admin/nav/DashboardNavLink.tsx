"use client";

import { usePathname } from "next/navigation";
import { Link } from "@payloadcms/ui";

export function DashboardNavLink() {
  const pathname = usePathname();
  // Dashboard is at the admin root "/"
  const isActive = pathname === "/" || pathname === "";

  return (
    <Link
      className={`nav__link${isActive ? " active" : ""}`}
      href="/"
    >
      {isActive && <div className="nav__link-indicator" />}
      <span className="nav__link-label">Dashboard</span>
    </Link>
  );
}
