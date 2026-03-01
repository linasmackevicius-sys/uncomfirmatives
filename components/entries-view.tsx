"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { api, type ListParams } from "@/lib/api-client";
import EntryTable from "@/components/entry-table";
import EntryList from "@/components/entry-list";
import EntryForm from "@/components/entry-form";
import FilterBar from "@/components/filter-bar";
import type { Entry, CreateEntryInput, PaginatedResponse } from "@/lib/types";

const VIEW_STORAGE_KEY = "entries-view-mode";

const FILTER_CONFIGS = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: "open", label: "Open" },
      { value: "in_progress", label: "In Progress" },
      { value: "resolved", label: "Resolved" },
      { value: "closed", label: "Closed" },
    ],
  },
  {
    key: "severity",
    label: "Severity",
    options: [
      { value: "minor", label: "Minor" },
      { value: "major", label: "Major" },
      { value: "critical", label: "Critical" },
    ],
  },
  {
    key: "group",
    label: "Group",
    options: [
      { value: "incoming_control", label: "Incoming Control" },
      { value: "production", label: "Production" },
      { value: "client", label: "Client" },
    ],
  },
];

interface Props {
  group?: string;
  title: string;
}

export default function EntriesView({ group, title }: Props) {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"table" | "list">("table");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [data, setData] = useState<PaginatedResponse>({
    data: [],
    total: 0,
    page: 1,
    page_size: 25,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize view mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    if (saved === "list" || saved === "table") setViewMode(saved);
  }, []);

  // Open form if ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowForm(true);
    }
  }, [searchParams]);

  const filters = useMemo<ListParams>(
    () => ({
      status: filterValues.status || "",
      severity: filterValues.severity || "",
      search,
      group: group || filterValues.group || "",
      page,
      page_size: pageSize,
    }),
    [filterValues, search, group, page, pageSize]
  );

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.entries.list(filtersRef.current);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [filterValues, search, group, page, pageSize, refresh]);

  const handleCreate = async (input: CreateEntryInput) => {
    await api.entries.create(group ? { ...input, group } : input);
    refresh();
  };

  const handleUpdate = async (input: CreateEntryInput) => {
    if (!editingEntry) return;
    await api.entries.update(editingEntry.id, input);
    refresh();
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEntry(undefined);
    // Clean URL if ?new=1
    if (searchParams.get("new")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleViewChange = (mode: "table" | "list") => {
    setViewMode(mode);
    localStorage.setItem(VIEW_STORAGE_KEY, mode);
  };

  const totalPages = Math.ceil(data.total / pageSize);

  // Filter out the group filter if group is already set via prop
  const activeFilterConfigs = group
    ? FILTER_CONFIGS.filter((f) => f.key !== "group")
    : FILTER_CONFIGS;

  return (
    <div>
      <div className="table-toolbar">
        <FilterBar
          filters={activeFilterConfigs}
          values={filterValues}
          onChange={handleFilterChange}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <div className="view-toggle">
          <button
            className={`view-toggle-btn${viewMode === "table" ? " active" : ""}`}
            onClick={() => handleViewChange("table")}
          >
            Table
          </button>
          <button
            className={`view-toggle-btn${viewMode === "list" ? " active" : ""}`}
            onClick={() => handleViewChange("list")}
          >
            List
          </button>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingEntry(undefined);
            setShowForm(true);
          }}
        >
          + New Entry
        </button>
      </div>

      {error && (
        <div style={{ color: "var(--error)", marginBottom: 12 }}>{error}</div>
      )}
      {loading ? (
        <div className="empty">
          <p>Loading...</p>
        </div>
      ) : viewMode === "table" ? (
        <EntryTable
          entries={data.data}
          onRefresh={refresh}
          onEdit={handleEdit}
        />
      ) : (
        <EntryList entries={data.data} />
      )}

      {data.total > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, data.total)} of {data.total}
          </div>
          <div className="pagination-controls">
            <button
              className="btn btn-sm btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i + 1;
              } else if (page >= totalPages - 3) {
                p = totalPages - 6 + i;
              } else {
                p = page - 3 + i;
              }
              return (
                <button
                  key={p}
                  className={`btn btn-sm ${p === page ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="btn btn-sm btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next →
            </button>
          </div>
          <div className="pagination-size">
            <span>Per page:</span>
            {[10, 25, 50].map((size) => (
              <button
                key={size}
                className={`btn btn-sm ${pageSize === size ? "btn-primary" : "btn-secondary"}`}
                onClick={() => {
                  setPageSize(size);
                  setPage(1);
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <EntryForm
          entry={editingEntry}
          defaultGroup={group}
          onSubmit={editingEntry ? handleUpdate : handleCreate}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
