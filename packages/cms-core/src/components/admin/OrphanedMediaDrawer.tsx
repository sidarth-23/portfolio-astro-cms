"use client";

import { useState } from "react";

import { Drawer, DrawerToggler, useDrawerSlug } from "@payloadcms/ui";
import { toast } from "@payloadcms/ui";

type OrphanedMediaItem = {
  id: string;
  filename: string | null;
  alt: string | null;
  url: string | null;
  createdAt: string;
};

type ScanResult = {
  orphaned: OrphanedMediaItem[];
  totalMedia: number;
};

type DeleteResult = {
  deleted: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
};

export function OrphanedMediaDrawer() {
  const drawerSlug = useDrawerSlug("orphaned-media");
  const [status, setStatus] = useState<"idle" | "scanning" | "deleting" | "done">("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function scan() {
    setStatus("scanning");
    setError(null);
    setResult(null);
    setSelectedIds(new Set());

    try {
      const res = await fetch("/api/orphaned-media", {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to scan for orphaned media.");
        setStatus("idle");
        return;
      }

      setResult(data as ScanResult);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setStatus("idle");
    }
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    if (!result) return;
    setSelectedIds(new Set(result.orphaned.map((item) => item.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function deleteIds(ids: string[]) {
    if (ids.length === 0) return;

    setStatus("deleting");
    setError(null);

    try {
      const res = await fetch("/api/orphaned-media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      });
      const data = (await res.json()) as DeleteResult;

      if (!res.ok) {
        setError("Delete request failed.");
        setStatus("done");
        return;
      }

      if (data.deleted > 0) {
        toast.success(`Deleted ${data.deleted} item${data.deleted !== 1 ? "s" : ""}.`);
      }
      if (data.failed > 0) {
        toast.error(`Failed to delete ${data.failed} item${data.failed !== 1 ? "s" : ""}.`);
      }

      // Re-scan after deletion
      await scan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error during deletion");
      setStatus("done");
    }
  }

  async function deleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${ids.length} selected item${ids.length !== 1 ? "s" : ""}? This cannot be undone.`,
    );
    if (!confirmed) return;

    await deleteIds(ids);
  }

  async function deleteAll() {
    if (!result || result.orphaned.length === 0) return;

    const confirmed = window.confirm(
      `Delete all ${result.orphaned.length} orphaned item${result.orphaned.length !== 1 ? "s" : ""}? This cannot be undone.`,
    );
    if (!confirmed) return;

    await deleteIds(result.orphaned.map((item) => item.id));
  }

  const isLoading = status === "scanning" || status === "deleting";
  const orphaned = result?.orphaned ?? [];
  const allSelected = orphaned.length > 0 && selectedIds.size === orphaned.length;

  return (
    <>
      <DrawerToggler
        slug={drawerSlug}
        onClick={() => { void scan(); }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 14px",
          background: "var(--theme-elevation-150)",
          color: "var(--theme-text)",
          border: "1px solid var(--theme-elevation-200)",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
          marginBottom: "12px",
        }}
      >
        Find Orphaned Media
      </DrawerToggler>

      <Drawer slug={drawerSlug} title="Orphaned Media">
        <div
          style={{
            padding: "24px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            color: "var(--theme-text)",
          }}
        >
          {/* Header description */}
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-base-800)", lineHeight: "1.5" }}>
            Media items that are not referenced by any collection document.
            {result && (
              <span>
                {" "}
                Found <strong>{orphaned.length}</strong> orphaned out of{" "}
                <strong>{result.totalMedia}</strong> total media items.
              </span>
            )}
          </p>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => void scan()}
              disabled={isLoading}
              style={{
                padding: "6px 14px",
                background: isLoading ? "var(--theme-elevation-150)" : "var(--theme-text)",
                color: isLoading ? "var(--color-base-800)" : "var(--theme-bg)",
                border: "none",
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {status === "scanning" ? "Scanning…" : "Re-scan"}
            </button>

            {orphaned.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={allSelected ? deselectAll : selectAll}
                  disabled={isLoading}
                  style={{
                    padding: "6px 14px",
                    background: "transparent",
                    color: "var(--theme-text)",
                    border: "1px solid var(--theme-elevation-200)",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </button>

                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => void deleteSelected()}
                    disabled={isLoading}
                    style={{
                      padding: "6px 14px",
                      background: "var(--theme-error-100, rgba(239,68,68,0.15))",
                      color: "var(--theme-error-500, #ef4444)",
                      border: "1px solid var(--theme-error-400, rgba(239,68,68,0.3))",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: isLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {status === "deleting" ? "Deleting…" : `Delete Selected (${selectedIds.size})`}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => void deleteAll()}
                  disabled={isLoading}
                  style={{
                    padding: "6px 14px",
                    background: "var(--theme-error-100, rgba(239,68,68,0.15))",
                    color: "var(--theme-error-500, #ef4444)",
                    border: "1px solid var(--theme-error-400, rgba(239,68,68,0.3))",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Delete All ({orphaned.length})
                </button>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--theme-error-50, rgba(239,68,68,0.08))",
                border: "1px solid var(--theme-error-400, rgba(239,68,68,0.3))",
                borderRadius: "4px",
                fontSize: "13px",
                color: "var(--theme-error-500, #ef4444)",
              }}
            >
              {error}
            </div>
          )}

          {/* Scanning state */}
          {status === "scanning" && (
            <div style={{ fontSize: "13px", color: "var(--color-base-800)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  border: "2px solid var(--theme-elevation-200)",
                  borderTopColor: "var(--theme-text)",
                  borderRadius: "50%",
                  animation: "orphan-spin 0.7s linear infinite",
                }}
              />
              Scanning media…
            </div>
          )}

          {/* Empty state */}
          {status === "done" && orphaned.length === 0 && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--theme-success-50, rgba(34,197,94,0.08))",
                border: "1px solid var(--theme-success-400, rgba(34,197,94,0.3))",
                borderRadius: "4px",
                fontSize: "13px",
                color: "var(--theme-text)",
              }}
            >
              No orphaned media found.
            </div>
          )}

          {/* Results list */}
          {orphaned.length > 0 && (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                border: "1px solid var(--theme-elevation-150)",
                borderRadius: "4px",
                background: "var(--theme-elevation-0)",
              }}
            >
              {orphaned.map((item) => (
                <label
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--theme-elevation-150)",
                    cursor: "pointer",
                    background: selectedIds.has(item.id) ? "var(--theme-elevation-50, rgba(0,0,0,0.03))" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    disabled={isLoading}
                    style={{ accentColor: "var(--theme-text)", flexShrink: 0 }}
                  />

                  {/* Thumbnail */}
                  {item.url ? (
                    <img
                      src={item.url}
                      alt={item.alt ?? item.filename ?? "media"}
                      style={{
                        width: "48px",
                        height: "48px",
                        objectFit: "cover",
                        borderRadius: "3px",
                        flexShrink: 0,
                        background: "var(--theme-elevation-150)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "3px",
                        background: "var(--theme-elevation-150)",
                        flexShrink: 0,
                      }}
                    />
                  )}

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--theme-text)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.filename ?? "(no filename)"}
                    </div>
                    {item.alt && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--color-base-800)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginTop: "2px",
                        }}
                      >
                        {item.alt}
                      </div>
                    )}
                    <div style={{ fontSize: "11px", color: "var(--theme-elevation-500, #9ca3af)", marginTop: "2px" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <style>{`@keyframes orphan-spin { to { transform: rotate(360deg); } }`}</style>
      </Drawer>
    </>
  );
}
