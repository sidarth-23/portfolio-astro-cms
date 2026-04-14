"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type DeploymentStatus = "deployed" | "building" | "failed" | "unknown";

type StatusResult = {
  status: DeploymentStatus;
  lastDeployedAt: string | null;
  deployUrl: string | null;
};

const STATUS_LABELS: Record<DeploymentStatus, string> = {
  deployed: "Deployed",
  building: "Building",
  failed: "Failed",
  unknown: "Unknown",
};

const STATUS_COLORS: Record<DeploymentStatus, { bg: string; text: string; border: string }> = {
  deployed: {
    bg: "var(--theme-success-50, rgba(34,197,94,0.1))",
    text: "var(--theme-success-500, #16a34a)",
    border: "var(--theme-success-300, rgba(34,197,94,0.4))",
  },
  building: {
    bg: "rgba(234,179,8,0.1)",
    text: "#a16207",
    border: "rgba(234,179,8,0.4)",
  },
  failed: {
    bg: "var(--theme-error-50, rgba(239,68,68,0.08))",
    text: "var(--theme-error-500, #ef4444)",
    border: "var(--theme-error-400, rgba(239,68,68,0.3))",
  },
  unknown: {
    bg: "var(--theme-elevation-50, rgba(0,0,0,0.04))",
    text: "var(--theme-elevation-500)",
    border: "var(--theme-elevation-200)",
  },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DeploymentStatusCard() {
  const [result, setResult] = useState<StatusResult | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async (isManual = false) => {
    if (isManual) setManualLoading(true);
    else setAutoRefreshing(true);

    try {
      const res = await fetch("/api/deployment-status", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as StatusResult;
        setResult(data);
      }
    } catch {
      // silently ignore — keep showing last known state
    } finally {
      if (isManual) setManualLoading(false);
      else setAutoRefreshing(false);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => void fetchStatus(false), 30_000);
  }, [fetchStatus]);

  useEffect(() => {
    void fetchStatus(false);
    startPolling();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus, startPolling]);

  const handleReload = () => {
    void fetchStatus(true);
    startPolling();
  };

  const status = result?.status ?? "unknown";
  const colors = STATUS_COLORS[status];

  return (
    <div style={{ marginTop: "8px", marginBottom: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: 600, color: "var(--theme-text)" }}>
            Deployment Status
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--theme-elevation-600)", lineHeight: "1.5" }}>
            Live status of the web app deployment.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReload}
          disabled={manualLoading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            background: "transparent",
            color: "var(--theme-text)",
            border: "1px solid var(--theme-elevation-200)",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: manualLoading ? "not-allowed" : "pointer",
            opacity: manualLoading ? 0.5 : 1,
          }}
        >
          {manualLoading && (
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                border: "2px solid var(--theme-elevation-400)",
                borderTopColor: "var(--theme-elevation-700)",
                borderRadius: "50%",
                animation: "ds-spin 0.7s linear infinite",
              }}
            />
          )}
          Reload
        </button>
      </div>

      <style>{`@keyframes ds-spin { to { transform: rotate(360deg); } }`}</style>

      <div
        style={{
          border: "1px solid var(--theme-elevation-150)",
          borderRadius: "4px",
          overflow: "hidden",
          opacity: autoRefreshing ? 0.6 : 1,
          transition: "opacity 0.2s",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "var(--theme-elevation-50)", borderBottom: "1px solid var(--theme-elevation-150)" }}>
              {["Service", "Status", "Last deployed", "Link"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 14px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "var(--theme-elevation-700)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "12px 14px", color: "var(--theme-text)", fontWeight: 500 }}>Web app</td>
              <td style={{ padding: "12px 14px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {status === "building" && (
                    <span
                      style={{
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        border: `2px solid ${colors.border}`,
                        borderTopColor: colors.text,
                        borderRadius: "50%",
                        animation: "ds-spin 0.7s linear infinite",
                      }}
                    />
                  )}
                  {STATUS_LABELS[status]}
                </span>
              </td>
              <td style={{ padding: "12px 14px", color: "var(--theme-elevation-700)" }}>
                {result ? formatDate(result.lastDeployedAt) : "—"}
              </td>
              <td style={{ padding: "12px 14px" }}>
                {result?.deployUrl ? (
                  <a
                    href={result.deployUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--theme-text)", fontSize: "12px", textDecoration: "underline" }}
                  >
                    Open
                  </a>
                ) : (
                  <span style={{ color: "var(--theme-elevation-400)" }}>—</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
