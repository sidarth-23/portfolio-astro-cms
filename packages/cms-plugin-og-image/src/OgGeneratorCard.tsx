"use client";

import { useState } from "react";
import type { OgGenerationMode, OgGenerationResult } from "./types";

export function OgGeneratorCard() {
  const [mode, setMode] = useState<OgGenerationMode>("unset-only");
  const [wipeOldImages, setWipeOldImages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OgGenerationResult | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setFatalError(null);

    try {
      const response = await fetch("/api/og-image/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, wipeOldImages: mode === "replace-all" && wipeOldImages }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setFatalError((data as { error?: string }).error ?? "An unexpected error occurred.");
      } else {
        setResult(data as OgGenerationResult);
      }
    } catch (err) {
      setFatalError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "24px", marginBottom: "24px" }}>
      <h3
        style={{
          margin: "0 0 6px 0",
          fontSize: "18px",
          fontWeight: 600,
          color: "var(--theme-text)",
        }}
      >
        OG Image Generator
      </h3>
      <p
        style={{
          margin: "0 0 20px 0",
          fontSize: "13px",
          color: "var(--theme-elevation-600)",
          lineHeight: "1.5",
        }}
      >
        Auto-generate branded Open Graph images using your profile image and social links from Site
        Settings. Posts and projects use their cover image; all other pages are auto-generated.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
        {(
          [
            { value: "unset-only", label: "Replace only unset meta images" },
            { value: "replace-all", label: "Replace all meta images" },
          ] as { value: OgGenerationMode; label: string }[]
        ).map(({ value, label }) => (
          <label
            key={value}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "var(--theme-text)",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="og-mode"
              value={value}
              checked={mode === value}
              onChange={() => {
                setMode(value);
                if (value !== "replace-all") {
                  setWipeOldImages(false);
                }
              }}
              disabled={loading}
              style={{ accentColor: "var(--theme-text)" }}
            />
            {label}
          </label>
        ))}

        {mode === "replace-all" && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "var(--theme-text)",
              cursor: "pointer",
              marginTop: "4px",
            }}
          >
            <input
              type="checkbox"
              name="og-wipe-old-images"
              checked={wipeOldImages}
              onChange={(event) => setWipeOldImages(event.target.checked)}
              disabled={loading}
              style={{ accentColor: "var(--theme-text)" }}
            />
            Also delete replaced old meta images (skip if still referenced)
          </label>
        )}
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 18px",
          background: loading ? "var(--theme-elevation-150)" : "var(--theme-text)",
          color: loading ? "var(--theme-elevation-500)" : "var(--theme-bg)",
          border: "none",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
      >
        {loading && (
          <span
            style={{
              display: "inline-block",
              width: "12px",
              height: "12px",
              border: "2px solid var(--theme-elevation-400)",
              borderTopColor: "var(--theme-elevation-600)",
              borderRadius: "50%",
              animation: "og-spin 0.7s linear infinite",
            }}
          />
        )}
        {loading ? "Generating…" : "Generate OG Images"}
      </button>

      <style>{`@keyframes og-spin { to { transform: rotate(360deg); } }`}</style>

      {fatalError && (
        <div
          style={{
            marginTop: "16px",
            padding: "10px 14px",
            background: "var(--theme-error-50, rgba(239,68,68,0.08))",
            border: "1px solid var(--theme-error-400, rgba(239,68,68,0.3))",
            borderRadius: "4px",
            fontSize: "13px",
            color: "var(--theme-error-500, #ef4444)",
          }}
        >
          {fatalError}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: "16px",
            padding: "10px 14px",
            background: "var(--theme-success-50, rgba(34,197,94,0.08))",
            border: "1px solid var(--theme-success-400, rgba(34,197,94,0.3))",
            borderRadius: "4px",
            fontSize: "13px",
            color: "var(--theme-text)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>
            Done — {result.generated} generated, {result.skipped} skipped
            {result.errors.length > 0 &&
              `, ${result.errors.length} error${result.errors.length > 1 ? "s" : ""}`}
          </div>
          {result.cleanup.enabled && (
            <div style={{ marginTop: "6px", marginBottom: "4px" }}>
              Cleanup — {result.cleanup.deleted} deleted, {result.cleanup.skippedReferenced} skipped
              (still referenced)
              {result.cleanup.failed > 0 && `, ${result.cleanup.failed} failed`}
            </div>
          )}
          {result.errors.length > 0 && (
            <ul style={{ margin: "6px 0 0 0", padding: "0 0 0 16px", lineHeight: "1.6" }}>
              {result.errors.map((e, i) => (
                <li key={i} style={{ color: "var(--theme-error-500, #ef4444)" }}>
                  <strong>{e.entity}:</strong> {e.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
