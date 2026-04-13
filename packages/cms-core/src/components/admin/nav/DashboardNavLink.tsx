"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function DashboardNavLink() {
  const pathname = usePathname();
  const isActive = pathname === "/" || pathname === "";

  return (
    <Link
      href="/"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        borderRadius: "4px",
        fontSize: "13px",
        fontWeight: isActive ? 600 : 400,
        color: isActive ? "var(--theme-text)" : "var(--theme-elevation-600)",
        background: isActive ? "var(--theme-elevation-100)" : "transparent",
        textDecoration: "none",
        transition: "background 0.15s, color 0.15s",
        marginBottom: "2px",
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M1 6L8 1L15 6V14C15 14.55 14.55 15 14 15H10V10H6V15H2C1.45 15 1 14.55 1 14V6Z"
          fill="currentColor"
          opacity="0.9"
        />
      </svg>
      Dashboard
    </Link>
  );
}
