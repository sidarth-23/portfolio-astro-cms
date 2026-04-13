"use client";

import { useState } from "react";

type GenerationMode = "unset-only" | "replace-all";

type GenerationResult = {
  total: number;
  generated: number;
  skipped: number;
  errors: Array<{ entity: string; error: string }>;
};

export function OgGeneratorCard() {
  const [mode, setMode] = useState<GenerationMode>("unset-only");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setFatalError(null);

    try {
      const response = await fetch("/api/og-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setFatalError(data.error ?? "An unexpected error occurred.");
      } else {
        setResult(data as GenerationResult);
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
        Auto-generate branded Open Graph images for all pages and posts using your profile image
        and social links from Site Settings.
      </p>

      {/* Mode selection */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "20px",
        }}
      >
        {(
          [
            { value: "unset-only", label: "Replace only unset meta images" },
            { value: "replace-all", label: "Replace all meta images" },
          ] as { value: GenerationMode; label: string }[]
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
              onChange={() => setMode(value)}
              disabled={loading}
              style={{ accentColor: "var(--theme-success-500, #6366f1)" }}
            />
            {label}
          </label>
        ))}
      </div>

      {/* Generate button */}
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

      {/* Spinner keyframe — injected inline */}
      <style>{`@keyframes og-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Result */}
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
            {result.errors.length > 0 && `, ${result.errors.length} errors`}
          </div>
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
