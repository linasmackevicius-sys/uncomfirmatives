"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
  type RowSelectionState,
  flexRender,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import type { Entry, EntryGroup } from "@/lib/types";
import { GROUP_LABELS } from "@/lib/types";
import StatusBadge from "@/components/status-badge";
import { api } from "@/lib/api-client";
import Link from "next/link";

interface Props {
  entries: Entry[];
  onRefresh: () => void;
  onEdit: (entry: Entry) => void;
}

export default function EntryTable({ entries, onRefresh, onEdit }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const handleStatusChange = async (id: number, status: string) => {
    await api.entries.updateStatus(id, status);
    onRefresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    await api.entries.delete(id);
    onRefresh();
  };

  const handleBatchStatus = async (status: string) => {
    const ids = Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((idx) => entries[Number(idx)]?.id)
      .filter(Boolean);
    await Promise.all(ids.map((id) => api.entries.updateStatus(id, status)));
    setRowSelection({});
    onRefresh();
  };

  const handleBatchDelete = async () => {
    const ids = Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((idx) => entries[Number(idx)]?.id)
      .filter(Boolean);
    if (!confirm(`Delete ${ids.length} entries?`)) return;
    await Promise.all(ids.map((id) => api.entries.delete(id)));
    setRowSelection({});
    onRefresh();
  };

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  const columns = useMemo<ColumnDef<Entry>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="row-checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="row-checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 40,
        enableSorting: false,
      },
      {
        id: "nc_id",
        header: "ID",
        size: 80,
        cell: ({ row }) => (
          <Link href={`/entries/detail/${row.original.id}`} className="nc-id">
            NC-{row.original.id}
          </Link>
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <Link
            href={`/entries/detail/${row.original.id}`}
            style={{ color: "var(--text-primary)", textDecoration: "none" }}
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "group",
        header: "Group",
        size: 140,
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return GROUP_LABELS[v as EntryGroup] || v;
        },
      },
      {
        accessorKey: "severity",
        header: "Severity",
        size: 100,
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return <span className={`severity-${v}`}>{v}</span>;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 140,
        cell: ({ row }) => (
          <select
            className="status-select"
            value={row.original.status}
            onChange={(e) =>
              handleStatusChange(row.original.id, e.target.value)
            }
            style={{
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          >
            <option value="open">open</option>
            <option value="in_progress">in progress</option>
            <option value="resolved">resolved</option>
            <option value="closed">closed</option>
          </select>
        ),
      },
      {
        accessorKey: "assigned_to",
        header: "Assigned To",
        size: 140,
        cell: ({ getValue }) =>
          getValue<string>() || (
            <span style={{ color: "var(--text-muted)" }}>—</span>
          ),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        size: 160,
        cell: ({ getValue }) => {
          const d = new Date(getValue<string>());
          const pad = (n: number) => String(n).padStart(2, "0");
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        },
      },
      {
        id: "actions",
        header: "",
        size: 100,
        cell: ({ row }) => (
          <div className="row-actions">
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => onEdit(row.original)}
            >
              Edit
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDelete(row.original.id)}
            >
              Del
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: entries,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  });

  if (entries.length === 0) {
    return (
      <div className="empty">
        <h3>No entries yet</h3>
        <p>Create your first nonconformity entry to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-container">
        <table>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    style={{
                      width: header.getSize(),
                      cursor: header.column.getCanSort() ? "pointer" : "default",
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{ asc: " ↑", desc: " ↓" }[
                      header.column.getIsSorted() as string
                    ] ?? ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCount > 0 && (
        <div className="batch-bar">
          <span className="batch-bar-count">{selectedCount} selected</span>
          <select
            className="status-select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) handleBatchStatus(e.target.value);
              e.target.value = "";
            }}
            style={{
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          >
            <option value="" disabled>
              Set status...
            </option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <button className="btn btn-sm btn-danger" onClick={handleBatchDelete}>
            Delete
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setRowSelection({})}
          >
            Clear
          </button>
        </div>
      )}
    </>
  );
}
