import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import type { Entry } from '../types'
import { GROUP_LABELS, type EntryGroup } from '../types'
import { api } from '../api/client'

interface Props {
  entries: Entry[]
  onRefresh: () => void
  onEdit: (entry: Entry) => void
}

export default function EntryTable({ entries, onRefresh, onEdit }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])

  const handleStatusChange = async (id: number, status: string) => {
    await api.entries.updateStatus(id, status)
    onRefresh()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry?')) return
    await api.entries.delete(id)
    onRefresh()
  }

  const columns = useMemo<ColumnDef<Entry>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
      },
      {
        accessorKey: 'group',
        header: 'Group',
        size: 140,
        cell: ({ getValue }) => {
          const v = getValue<string>()
          return GROUP_LABELS[v as EntryGroup] || v
        },
      },
      {
        accessorKey: 'severity',
        header: 'Severity',
        size: 100,
        cell: ({ getValue }) => {
          const v = getValue<string>()
          return <span className={`severity-${v}`}>{v}</span>
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 140,
        cell: ({ row }) => (
          <select
            className="status-select"
            value={row.original.status}
            onChange={(e) => handleStatusChange(row.original.id, e.target.value)}
            style={{
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
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
        accessorKey: 'assigned_to',
        header: 'Assigned To',
        size: 140,
        cell: ({ getValue }) => getValue<string>() || <span style={{ color: 'var(--text-muted)' }}>—</span>,
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        size: 160,
        cell: ({ getValue }) => {
          const d = new Date(getValue<string>())
          return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        },
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) => (
          <div className="row-actions">
            <button className="btn btn-sm btn-secondary" onClick={() => onEdit(row.original)}>
              Edit
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(row.original.id)}>
              Del
            </button>
          </div>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: entries,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (entries.length === 0) {
    return (
      <div className="empty">
        <h3>No entries yet</h3>
        <p>Create your first nonconformity entry to get started.</p>
      </div>
    )
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ width: header.getSize() }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
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
  )
}
