"use client";

import { useState } from "react";
import type { Column } from "payload";

import {
  Button,
  Drawer,
  DrawerToggler,
  Pagination,
  Table,
  toast,
  useDrawerSlug,
} from "@payloadcms/ui";

const PAGE_LIMIT = 10;

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

// field is required by the Column type but never read by the Table renderer
const DUMMY_FIELD = {} as Column["field"];

export function OrphanedMediaDrawer() {
  const drawerSlug = useDrawerSlug("orphaned-media");
  const [status, setStatus] = useState<"idle" | "scanning" | "deleting" | "done">("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ ids: string[]; label: string } | null>(null);
  const [page, setPage] = useState(1);

  async function scan() {
    setStatus("scanning");
    setError(null);
    setResult(null);
    setSelectedIds(new Set());
    setPage(1);

    try {
      const res = await fetch("/api/orphaned-media", { credentials: "include" });
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
      const data = (await res.json().catch(() => ({}))) as DeleteResult & { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Delete request failed.");
        setStatus("done");
        return;
      }

      if (data.deleted > 0) toast.success(`Deleted ${data.deleted} item${data.deleted !== 1 ? "s" : ""}.`);
      if (data.failed > 0) toast.error(`Failed to delete ${data.failed} item${data.failed !== 1 ? "s" : ""}.`);

      await scan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error during deletion");
      setStatus("done");
    }
  }

  function confirmDelete(ids: string[], label: string) {
    setPendingAction({ ids, label });
  }

  const isLoading = status === "scanning" || status === "deleting";
  const orphaned = result?.orphaned ?? [];
  const allSelected = orphaned.length > 0 && selectedIds.size === orphaned.length;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(orphaned.length / PAGE_LIMIT));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_LIMIT;
  const pageItems = orphaned.slice(startIndex, startIndex + PAGE_LIMIT);

  // Build Table columns — renderedCells is indexed by pageItems row
  const columns: Column[] = [
    {
      accessor: "select",
      active: true,
      field: DUMMY_FIELD,
      Heading: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={allSelected ? deselectAll : selectAll}
          disabled={isLoading || orphaned.length === 0}
          title={allSelected ? "Deselect all" : "Select all"}
          style={{ cursor: "pointer" }}
        />
      ),
      renderedCells: pageItems.map((item) => (
        <input
          key={item.id}
          type="checkbox"
          checked={selectedIds.has(item.id)}
          onChange={() => toggleItem(item.id)}
          disabled={isLoading}
          style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
        />
      )),
    },
    {
      accessor: "url",
      active: true,
      field: DUMMY_FIELD,
      Heading: "Preview",
      renderedCells: pageItems.map((item) =>
        item.url ? (
          <img
            key={item.id}
            src={item.url}
            alt={item.alt ?? item.filename ?? "media"}
            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 3, display: "block" }}
          />
        ) : (
          <div
            key={item.id}
            style={{
              width: 40,
              height: 40,
              borderRadius: 3,
              background: "var(--theme-elevation-150)",
            }}
          />
        ),
      ),
    },
    {
      accessor: "filename",
      active: true,
      field: DUMMY_FIELD,
      Heading: "File",
      renderedCells: pageItems.map((item) => (
        <div key={item.id} style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 260,
            }}
          >
            {item.filename ?? "(no filename)"}
          </div>
          {item.alt && (
            <div
              style={{
                fontSize: "0.8em",
                color: "var(--theme-elevation-500)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 260,
                marginTop: 2,
              }}
            >
              {item.alt}
            </div>
          )}
        </div>
      )),
    },
    {
      accessor: "createdAt",
      active: true,
      field: DUMMY_FIELD,
      Heading: "Created",
      renderedCells: pageItems.map((item) => (
        <span key={item.id} style={{ whiteSpace: "nowrap" }}>
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      )),
    },
    {
      accessor: "actions",
      active: true,
      field: DUMMY_FIELD,
      Heading: "",
      renderedCells: pageItems.map((item) => (
        <Button
          key={item.id}
          buttonStyle="error"
          size="small"
          disabled={isLoading}
          onClick={() =>
            confirmDelete([item.id], `Delete "${item.filename ?? item.id}"? This cannot be undone.`)
          }
        >
          Delete
        </Button>
      )),
    },
  ];

  return (
    <>
      <DrawerToggler
        slug={drawerSlug}
        onClick={() => { void scan(); }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          background: "var(--theme-elevation-150)",
          color: "var(--theme-text)",
          border: "1px solid var(--theme-elevation-200)",
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          marginBottom: 12,
        }}
      >
        Find Orphaned Media
      </DrawerToggler>

      <Drawer slug={drawerSlug} title="Orphaned Media">
        <div
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            color: "var(--theme-text)",
          }}
        >
          {/* Description */}
          <p style={{ margin: 0, fontSize: 13, color: "var(--theme-elevation-800)", lineHeight: 1.5 }}>
            Media items that are not referenced by any collection document.
            {result && (
              <span>
                {" "}Found <strong>{orphaned.length}</strong> orphaned out of{" "}
                <strong>{result.totalMedia}</strong> total media items.
              </span>
            )}
          </p>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Button
              buttonStyle="secondary"
              size="small"
              disabled={isLoading}
              onClick={() => void scan()}
            >
              {status === "scanning" ? "Scanning…" : "Re-scan"}
            </Button>

            {orphaned.length > 0 && (
              <>
                <Button
                  buttonStyle="subtle"
                  size="small"
                  disabled={isLoading}
                  onClick={allSelected ? deselectAll : selectAll}
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>

                {selectedIds.size > 0 && (
                  <Button
                    buttonStyle="error"
                    size="small"
                    disabled={isLoading}
                    onClick={() =>
                      confirmDelete(
                        Array.from(selectedIds),
                        `Delete ${selectedIds.size} selected item${selectedIds.size !== 1 ? "s" : ""}? This cannot be undone.`,
                      )
                    }
                  >
                    {isLoading ? "Processing…" : `Delete Selected (${selectedIds.size})`}
                  </Button>
                )}

                <Button
                  buttonStyle="error"
                  size="small"
                  disabled={isLoading}
                  onClick={() =>
                    confirmDelete(
                      orphaned.map((item) => item.id),
                      `Delete all ${orphaned.length} orphaned item${orphaned.length !== 1 ? "s" : ""}? This cannot be undone.`,
                    )
                  }
                >
                  Delete All ({orphaned.length})
                </Button>
              </>
            )}
          </div>

          {/* Inline confirmation */}
          {pendingAction && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "var(--theme-error-50, rgba(239,68,68,0.08))",
                border: "1px solid var(--theme-error-400, rgba(239,68,68,0.3))",
                borderRadius: 4,
                fontSize: 13,
                flexWrap: "wrap",
              }}
            >
              <span style={{ flex: 1, color: "var(--theme-error-500, #ef4444)", fontWeight: 500 }}>
                {pendingAction.label}
              </span>
              <Button
                buttonStyle="error"
                size="small"
                onClick={() => { void deleteIds(pendingAction.ids); setPendingAction(null); }}
              >
                Confirm Delete
              </Button>
              <Button
                buttonStyle="secondary"
                size="small"
                onClick={() => setPendingAction(null)}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--theme-error-50, rgba(239,68,68,0.08))",
                border: "1px solid var(--theme-error-400, rgba(239,68,68,0.3))",
                borderRadius: 4,
                fontSize: 13,
                color: "var(--theme-error-500, #ef4444)",
              }}
            >
              {error}
            </div>
          )}

          {/* Scanning state */}
          {status === "scanning" && (
            <div style={{ fontSize: 13, color: "var(--theme-elevation-800)", display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
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
                borderRadius: 4,
                fontSize: 13,
              }}
            >
              No orphaned media found.
            </div>
          )}

          {/* Table */}
          {orphaned.length > 0 && (
            <>
              <Table columns={columns} data={pageItems} appearance="condensed" />

              {totalPages > 1 && (
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  hasNextPage={safePage < totalPages}
                  hasPrevPage={safePage > 1}
                  nextPage={safePage < totalPages ? safePage + 1 : undefined}
                  prevPage={safePage > 1 ? safePage - 1 : undefined}
                  limit={PAGE_LIMIT}
                  onChange={(p) => setPage(p)}
                />
              )}
            </>
          )}
        </div>

        <style>{`@keyframes orphan-spin { to { transform: rotate(360deg); } }`}</style>
      </Drawer>
    </>
  );
}
