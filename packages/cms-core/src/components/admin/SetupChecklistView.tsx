import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";

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

export function SetupChecklistView(props: AdminViewServerProps) {
  const { initPageResult, params } = props;
  const { req, permissions, visibleEntities, locale } = initPageResult;

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
    <div style={{ padding: "32px", maxWidth: "860px" }}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: 700, color: "var(--theme-text)" }}>
        Setup Checklist
      </h2>
      <p style={{ margin: "0 0 28px 0", fontSize: "13px", color: "var(--theme-elevation-700)" }}>
        Follow these steps to get your site ready for production.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {RULES.map((rule, i) => (
          <div
            key={rule.title}
            style={{
              display: "flex",
              gap: "16px",
              padding: "16px 20px",
              border: "1px solid var(--theme-elevation-150)",
              borderRadius: "4px",
              background: "var(--theme-elevation-50)",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "var(--theme-elevation-150)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--theme-text)",
              }}
            >
              {i + 1}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--theme-text)", marginBottom: "6px" }}>
                {rule.title}
              </div>
              <div style={{ fontSize: "13px", color: "var(--theme-elevation-700)", lineHeight: "1.6" }}>
                {rule.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </DefaultTemplate>
  );
}
