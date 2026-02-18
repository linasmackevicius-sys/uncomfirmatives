import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useEntries, useSSE } from '../hooks/useEntries'
import { api } from '../api/client'
import EntryTable from '../components/EntryTable'
import EntryForm from '../components/EntryForm'
import type { Entry, CreateEntryInput, EntryGroup } from '../types'
import { GROUP_LABELS } from '../types'

export default function Entries() {
  const { group } = useParams<{ group?: string }>()
  const [statusFilter, setStatusFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Entry | undefined>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filters = useMemo(
    () => ({
      status: statusFilter,
      severity: severityFilter,
      search,
      group: group || '',
      page,
      page_size: pageSize,
    }),
    [statusFilter, severityFilter, search, group, page, pageSize],
  )

  const { entries, total, loading, error, refresh } = useEntries(filters)

  useSSE(() => { refresh() })

  const handleCreate = async (data: CreateEntryInput) => {
    await api.entries.create({ ...data, group: group || data.group })
    refresh()
  }

  const handleUpdate = async (data: CreateEntryInput) => {
    if (!editingEntry) return
    await api.entries.update(editingEntry.id, data)
    refresh()
  }

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingEntry(undefined)
  }

  const totalPages = Math.ceil(total / pageSize)
  const title = group ? GROUP_LABELS[group as EntryGroup] || 'Entries' : 'All Entries'

  return (
    <div>
      <h2 className="page-title">{title}</h2>
      <div className="table-toolbar">
        <input
          placeholder="Search entries..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1) }}>
          <option value="">All severities</option>
          <option value="minor">Minor</option>
          <option value="major">Major</option>
          <option value="critical">Critical</option>
        </select>
        <button className="btn btn-primary" onClick={() => { setEditingEntry(undefined); setShowForm(true) }}>
          + New Entry
        </button>
      </div>

      {error && <div style={{ color: 'var(--error)', marginBottom: 12 }}>{error}</div>}
      {loading ? (
        <div className="empty"><p>Loading...</p></div>
      ) : (
        <EntryTable entries={entries} onRefresh={refresh} onEdit={handleEdit} />
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </div>
          <div className="pagination-controls">
            <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number
              if (totalPages <= 7) {
                p = i + 1
              } else if (page <= 4) {
                p = i + 1
              } else if (page >= totalPages - 3) {
                p = totalPages - 6 + i
              } else {
                p = page - 3 + i
              }
              return (
                <button
                  key={p}
                  className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            })}
            <button className="btn btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next →
            </button>
          </div>
          <div className="pagination-size">
            <span>Per page:</span>
            {[10, 25, 50].map((size) => (
              <button
                key={size}
                className={`btn btn-sm ${pageSize === size ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setPageSize(size); setPage(1) }}
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
          defaultGroup={group || undefined}
          onSubmit={editingEntry ? handleUpdate : handleCreate}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
