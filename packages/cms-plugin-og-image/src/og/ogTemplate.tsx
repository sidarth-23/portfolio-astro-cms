import type { ReactElement } from "react";
import type { OgTemplateProps } from "../types";

export type { OgTemplateProps };

const clampText = (value: string, maxLength: number): string => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength - 1).trimEnd() + "…";
};

const toDisplayHost = (siteUrl: string): string => {
  try {
    return new URL(siteUrl).host;
  } catch {
    return siteUrl;
  }
};

export function OgTemplate({
  title,
  description,
  profileImageDataUri,
  socialIconDataUris,
  siteUrl = "https://sidshub.in",
}: OgTemplateProps): ReactElement {
  const displayTitle = clampText(title, 60);
  const displayDescription = clampText(description, 132);
  const displayHost = toDisplayHost(siteUrl);

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
        padding: "56px 64px",
        position: "relative",
        fontFamily: "'Atkinson Hyperlegible', sans-serif",
      }}
    >
      {/* Subtle grid pattern overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 80% 20%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(139,92,246,0.08) 0%, transparent 50%)",
          display: "flex",
        }}
      />

      {/* Main content row */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flex: 1,
          gap: 40,
        }}
      >
        {/* Left: title area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            gap: 20,
            paddingRight: profileImageDataUri ? 12 : 0,
          }}
        >
          {/* Decorative accent line */}
          <div
            style={{
              width: 48,
              height: 4,
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              borderRadius: 2,
              display: "flex",
            }}
          />

          <div
            style={{
              fontSize: displayTitle.length > 40 ? 52 : 62,
              fontWeight: 700,
              color: "#f8fafc",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              display: "flex",
            }}
          >
            {displayTitle}
          </div>

          <div
            style={{
              maxWidth: 720,
              fontSize: 26,
              fontWeight: 400,
              color: "rgba(226,232,240,0.78)",
              lineHeight: 1.4,
              letterSpacing: "-0.01em",
              display: "flex",
            }}
          >
            {displayDescription}
          </div>
        </div>

        {/* Right: profile image */}
        {profileImageDataUri && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: "9999px",
                overflow: "hidden",
                display: "flex",
                boxShadow: "0 0 40px rgba(99,102,241,0.25)",
              }}
            >
              <img
                src={profileImageDataUri}
                width={180}
                height={180}
                style={{ objectFit: "cover", width: 180, height: 180, borderRadius: "9999px" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 28,
          borderTop: "1px solid rgba(148,163,184,0.15)",
        }}
      >
        {/* Site name */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: "rgba(148,163,184,0.8)",
            letterSpacing: "0.02em",
            display: "flex",
          }}
        >
          {displayHost}
        </div>

        {/* Social icons */}
        {socialIconDataUris.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 20,
              alignItems: "center",
            }}
          >
            {socialIconDataUris.slice(0, 4).map((uri, i) => (
              <img
                key={i}
                src={uri}
                width={22}
                height={22}
                style={{
                  opacity: 0.8,
                  width: 22,
                  height: 22,
                  filter: "brightness(0) invert(1)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
