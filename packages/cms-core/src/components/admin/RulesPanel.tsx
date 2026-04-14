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

export function RulesPanel() {
  return (
    <div style={{ marginBottom: "32px" }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: 600, color: "var(--theme-text)" }}>
        Setup checklist
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
    </div>
  );
}
