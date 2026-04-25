"use client";

import { useState } from "react";
import type { Column } from "payload";
import {
  Banner,
  Button,
  ConfirmationModal,
  Drawer,
  DrawerContentContainer,
  Pagination,
  Table,
  toast,
  useDrawerSlug,
  useModal,
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

const DUMMY_FIELD = {} as Column["field"];

export function OrphanedMediaDrawer() {
  const drawerSlug = useDrawerSlug("orphaned-media");
  const confirmModalSlug = useDrawerSlug("orphaned-media-confirm-delete");
  const { openModal } = useModal();

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
      const response = await fetch("/api/orphaned-media", { credentials: "include" });
      const data = await response.json();

      if (!response.ok) {
        setError((data as { error?: string }).error ?? "Failed to scan for orphaned media.");
        setStatus("idle");
        return;
      }

      setResult(data as ScanResult);
      setStatus("done");
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Network error");
      setStatus("idle");
    }
  }

  function toggleItem(id: string) {
    setSelectedIds((previousValue) => {
      const nextValue = new Set(previousValue);

      if (nextValue.has(id)) {
        nextValue.delete(id);
      } else {
        nextValue.add(id);
      }

      return nextValue;
    });
  }

  function selectAll() {
    if (!result) {
      return;
    }

    setSelectedIds(new Set(result.orphaned.map((item) => item.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function deleteIds(ids: string[]) {
    if (ids.length === 0) {
      return;
    }

    setStatus("deleting");
    setError(null);

    try {
      const response = await fetch("/api/orphaned-media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      });

      const data = (await response.json().catch(() => ({}))) as DeleteResult & { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Delete request failed.");
        setStatus("done");
        return;
      }

      if (data.deleted > 0) {
        toast.success(`Deleted ${data.deleted} item${data.deleted !== 1 ? "s" : ""}.`);
      }

      if (data.failed > 0) {
        toast.error(`Failed to delete ${data.failed} item${data.failed !== 1 ? "s" : ""}.`);
      }

      await scan();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Network error during deletion",
      );
      setStatus("done");
    }
  }

  function confirmDelete(ids: string[], label: string) {
    setPendingAction({ ids, label });
    openModal(confirmModalSlug);
  }

  const isLoading = status === "scanning" || status === "deleting";
  const orphaned = result?.orphaned ?? [];
  const allSelected = orphaned.length > 0 && selectedIds.size === orphaned.length;

  const totalPages = Math.max(1, Math.ceil(orphaned.length / PAGE_LIMIT));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_LIMIT;
  const pageItems = orphaned.slice(startIndex, startIndex + PAGE_LIMIT);

  const columns: Column[] = [
    {
      accessor: "select",
      active: true,
      field: DUMMY_FIELD,
      Heading: (
        <input
          checked={allSelected}
          disabled={isLoading || orphaned.length === 0}
          onChange={allSelected ? deselectAll : selectAll}
          title={allSelected ? "Deselect all" : "Select all"}
          type="checkbox"
        />
      ),
      renderedCells: pageItems.map((item) => (
        <input
          checked={selectedIds.has(item.id)}
          disabled={isLoading}
          key={item.id}
          onChange={() => toggleItem(item.id)}
          type="checkbox"
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
            alt={item.alt ?? item.filename ?? "media"}
            key={item.id}
            src={item.url}
            style={{
              width: 40,
              height: 40,
              objectFit: "cover",
              borderRadius: 3,
              display: "block",
            }}
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
                color: "var(--theme-elevation-700)",
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
          buttonStyle="error"
          disabled={isLoading}
          key={item.id}
          onClick={() =>
            confirmDelete(
              [item.id],
              `Delete \"${item.filename ?? item.id}\"? This cannot be undone.`,
            )
          }
          size="small"
        >
          Delete
        </Button>
      )),
    },
  ];

  return (
    <>
      <Button
        buttonStyle="secondary"
        onClick={() => {
          openModal(drawerSlug);
          void scan();
        }}
        size="small"
        type="button"
      >
        Find Orphaned Media
      </Button>

      <Drawer slug={drawerSlug} title="Orphaned Media">
        <DrawerContentContainer>
          <div style={{ display: "grid", gap: "calc(var(--base) / 2)" }}>
            <p style={{ margin: 0, color: "var(--theme-elevation-700)" }}>
              Media items that are not referenced by any collection document.
              {result && (
                <span>
                  {" "}
                  Found <strong>{orphaned.length}</strong> orphaned out of{" "}
                  <strong>{result.totalMedia}</strong> total media items.
                </span>
              )}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Button
                buttonStyle="secondary"
                disabled={isLoading}
                onClick={() => void scan()}
                size="small"
              >
                {status === "scanning" ? "Scanning..." : "Re-scan"}
              </Button>

              {orphaned.length > 0 && (
                <>
                  <Button
                    buttonStyle="subtle"
                    disabled={isLoading}
                    onClick={allSelected ? deselectAll : selectAll}
                    size="small"
                  >
                    {allSelected ? "Deselect All" : "Select All"}
                  </Button>

                  {selectedIds.size > 0 && (
                    <Button
                      buttonStyle="error"
                      disabled={isLoading}
                      onClick={() =>
                        confirmDelete(
                          Array.from(selectedIds),
                          `Delete ${selectedIds.size} selected item${selectedIds.size !== 1 ? "s" : ""}? This cannot be undone.`,
                        )
                      }
                      size="small"
                    >
                      {isLoading ? "Processing..." : `Delete Selected (${selectedIds.size})`}
                    </Button>
                  )}

                  <Button
                    buttonStyle="error"
                    disabled={isLoading}
                    onClick={() =>
                      confirmDelete(
                        orphaned.map((item) => item.id),
                        `Delete all ${orphaned.length} orphaned item${orphaned.length !== 1 ? "s" : ""}? This cannot be undone.`,
                      )
                    }
                    size="small"
                  >
                    Delete All ({orphaned.length})
                  </Button>
                </>
              )}
            </div>

            {error && <Banner type="error">{error}</Banner>}

            {status === "scanning" && <Banner>Scanning media...</Banner>}

            {status === "done" && orphaned.length === 0 && (
              <Banner type="success">No orphaned media found.</Banner>
            )}

            {orphaned.length > 0 && (
              <>
                <Table appearance="condensed" columns={columns} data={pageItems} />

                {totalPages > 1 && (
                  <Pagination
                    hasNextPage={safePage < totalPages}
                    hasPrevPage={safePage > 1}
                    limit={PAGE_LIMIT}
                    nextPage={safePage < totalPages ? safePage + 1 : undefined}
                    onChange={(nextPage) => setPage(nextPage)}
                    page={safePage}
                    prevPage={safePage > 1 ? safePage - 1 : undefined}
                    totalPages={totalPages}
                  />
                )}
              </>
            )}
          </div>
        </DrawerContentContainer>
      </Drawer>

      <ConfirmationModal
        body={pendingAction?.label ?? ""}
        cancelLabel="Cancel"
        confirmLabel="Confirm Delete"
        heading="Delete media?"
        modalSlug={confirmModalSlug}
        onCancel={() => {
          setPendingAction(null);
        }}
        onConfirm={async () => {
          const ids = pendingAction?.ids ?? [];
          setPendingAction(null);
          await deleteIds(ids);
        }}
      />
    </>
  );
}
