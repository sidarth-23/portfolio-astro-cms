"use client";

import { Drawer, DrawerToggler, useDrawerSlug } from "@payloadcms/ui";

type Rule = { title: string; body: string };

const RULES: Rule[] = [
  {
    title: "Add SEO metadata before generating OG images",
    body: "Every post, project, and page global needs a title and description in the SEO tab before you run the OG Image Generator. The generator skips items that already have images — use \"Replace only unset meta images\" for day-to-day use.",
  },
  {
    title: "Configure Site Settings before going live",
    body: "Open Globals → Site Settings and fill in your profile image, display name, and social links. These are used across OG image generation and the site header. Without them, OG images will render without branding.",
  },
  {
    title: "Fill all page globals before the first deploy",
    body: "Each page (Home, Blog, Projects, CV, Series, 404) has a global that controls its content. Set them up before deploying to production to avoid blank or broken pages.",
  },
];

export function SetupChecklistHeaderAction() {
  const drawerSlug = useDrawerSlug("setup-checklist");

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
        <DrawerToggler
          slug={drawerSlug}
          title="Setup checklist"
          aria-label="Open setup checklist"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            background: "transparent",
            border: "1px solid var(--theme-elevation-200)",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--theme-text)",
          }}
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2 3.5H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M2 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M2 12.5H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M8.5 3.5L9.5 4.5L11.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.5 8L9.5 9L11.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.5 12.5L9.5 13.5L11.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </DrawerToggler>
      </div>

      <Drawer slug={drawerSlug} title="Setup Checklist">
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {RULES.map((rule) => (
            <div
              key={rule.title}
              style={{
                padding: "12px 16px",
                border: "1px solid var(--theme-elevation-150)",
                borderRadius: "4px",
                background: "var(--theme-elevation-50)",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--theme-text)", marginBottom: "4px" }}>
                {rule.title}
              </div>
              <div style={{ fontSize: "13px", color: "var(--theme-elevation-700)", lineHeight: "1.6" }}>
                {rule.body}
              </div>
            </div>
          ))}
        </div>
      </Drawer>
    </>
  );
}
