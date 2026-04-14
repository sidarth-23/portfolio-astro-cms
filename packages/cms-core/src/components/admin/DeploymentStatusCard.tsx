"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pill } from "@payloadcms/ui";

import type { HookType } from "../../lib/deployment/factory";

type DeploymentStatus = "deployed" | "building" | "failed" | "unknown";

type StatusResult = {
  configured: boolean;
  misconfigured: boolean;
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

const STATUS_PILL_STYLE: Record<DeploymentStatus, "success" | "warning" | "error" | "light-gray"> =
  {
    deployed: "success",
    building: "warning",
    failed: "error",
    unknown: "light-gray",
  };

const HOOK_TYPE_LABELS: Record<HookType, string> = {
  dokploy: "Dokploy",
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

type Props = {
  hookType?: HookType;
};

export function DeploymentStatusCard({ hookType }: Props) {
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

  const serviceLabel = hookType ? (HOOK_TYPE_LABELS[hookType] ?? hookType) : "Web app";

  return (
    <div style={{ marginTop: "8px", marginBottom: "32px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div>
          <h3
            style={{
              margin: "0 0 4px 0",
              fontSize: "18px",
              fontWeight: 600,
              color: "var(--theme-text)",
            }}
          >
            Deployment Status
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "var(--theme-elevation-600)",
              lineHeight: "1.5",
            }}
          >
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
            <tr
              style={{
                background: "var(--theme-elevation-50)",
                borderBottom: "1px solid var(--theme-elevation-150)",
              }}
            >
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
            {result?.misconfigured ? (
              <tr>
                <td style={{ padding: "12px 14px", color: "var(--theme-text)", fontWeight: 500 }}>
                  {serviceLabel}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <Pill pillStyle="error">Misconfigured</Pill>
                </td>
                <td
                  colSpan={2}
                  style={{
                    padding: "12px 14px",
                    color: "var(--theme-error-500, #ef4444)",
                    fontSize: "12px",
                  }}
                >
                  SITE_BUILD_HOOK_URL, SITE_BUILD_HOOK_SECRET, or provider-specific vars are
                  missing.
                </td>
              </tr>
            ) : result !== null && !result.configured ? (
              <tr>
                <td style={{ padding: "12px 14px", color: "var(--theme-text)", fontWeight: 500 }}>
                  {serviceLabel}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <Pill pillStyle="light-gray">Not configured</Pill>
                </td>
                <td
                  colSpan={2}
                  style={{
                    padding: "12px 14px",
                    color: "var(--theme-elevation-500)",
                    fontSize: "12px",
                  }}
                >
                  Adapter not initialised. Check your deployment environment variables.
                </td>
              </tr>
            ) : (
              <tr>
                <td style={{ padding: "12px 14px", color: "var(--theme-text)", fontWeight: 500 }}>
                  {serviceLabel}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  {result ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      {result.status === "building" && (
                        <span
                          style={{
                            display: "inline-block",
                            width: "8px",
                            height: "8px",
                            border: "2px solid var(--theme-elevation-300)",
                            borderTopColor: "var(--theme-elevation-700)",
                            borderRadius: "50%",
                            animation: "ds-spin 0.7s linear infinite",
                          }}
                        />
                      )}
                      <Pill pillStyle={STATUS_PILL_STYLE[result.status]}>
                        {STATUS_LABELS[result.status]}
                      </Pill>
                    </span>
                  ) : (
                    <Pill pillStyle="light-gray">—</Pill>
                  )}
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
                      style={{
                        color: "var(--theme-text)",
                        fontSize: "12px",
                        textDecoration: "underline",
                      }}
                    >
                      Open
                    </a>
                  ) : (
                    <span style={{ color: "var(--theme-elevation-400)" }}>—</span>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
