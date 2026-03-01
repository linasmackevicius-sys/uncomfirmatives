"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useEntryEvents } from "@/hooks/use-entry-events";
import type { Entry, EntryGroup } from "@/lib/types";
import { GROUP_LABELS } from "@/lib/types";
import StatusBadge from "@/components/status-badge";

interface Props {
  id: number;
}

const SEVERITY_LABELS: Record<string, string> = {
  minor: "Minor",
  major: "Major",
  critical: "Critical",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export default function EntryDetail({ id }: Props) {
  const router = useRouter();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descValue, setDescValue] = useState("");

  const loadEntry = useCallback(async () => {
    setLoading(true);
    try {
      const e = await api.entries.get(id);
      setEntry(e);
      setTitleValue(e.title);
      setDescValue(e.description || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entry");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const { suppressBriefly } = useEntryEvents(loadEntry, { entryId: id });

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  async function updateField(field: string, value: string) {
    if (!entry) return;
    suppressBriefly();
    try {
      await api.entries.update(entry.id, { [field]: value });
      loadEntry();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleDelete() {
    if (!entry || !confirm("Delete this entry?")) return;
    suppressBriefly();
    await api.entries.delete(entry.id);
    router.push("/entries");
  }

  function exitEditMode() {
    setEditing(false);
    setEditingTitle(false);
    setEditingDesc(false);
  }

  if (loading) {
    return (
      <div className="empty">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="empty">
        <h3>Error</h3>
        <p>{error || "Entry not found"}</p>
      </div>
    );
  }

  const created = new Date(entry.created_at);
  const updated = new Date(entry.updated_at);
  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="entry-detail">
      <div className="entry-detail-main">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div className="detail-id">NC-{entry.id}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {editing ? (
              <button className="btn btn-secondary btn-sm" onClick={exitEditMode}>
                Done
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>
                Edit
              </button>
            )}
          </div>
        </div>

        {editing && editingTitle ? (
          <input
            className="inline-edit"
            style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={() => {
              setEditingTitle(false);
              if (titleValue !== entry.title) updateField("title", titleValue);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setEditingTitle(false);
                if (titleValue !== entry.title) updateField("title", titleValue);
              }
              if (e.key === "Escape") {
                setEditingTitle(false);
                setTitleValue(entry.title);
              }
            }}
            autoFocus
          />
        ) : (
          <h1
            className="detail-title"
            onClick={editing ? () => setEditingTitle(true) : undefined}
            style={{ cursor: editing ? "text" : "default" }}
          >
            {entry.title}
          </h1>
        )}

        <div style={{ marginBottom: 24 }}>
          {editing && editingDesc ? (
            <textarea
              className="inline-edit"
              style={{ minHeight: 120, fontSize: 14, lineHeight: 1.6 }}
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={() => {
                setEditingDesc(false);
                if (descValue !== (entry.description || ""))
                  updateField("description", descValue);
              }}
              autoFocus
            />
          ) : entry.description ? (
            <div
              className="detail-description"
              onClick={editing ? () => setEditingDesc(true) : undefined}
              style={{ cursor: editing ? "text" : "default" }}
            >
              {entry.description}
            </div>
          ) : editing ? (
            <div
              className="detail-description-empty"
              onClick={() => setEditingDesc(true)}
              style={{ cursor: "text" }}
            >
              Click to add description...
            </div>
          ) : (
            <div className="detail-description-empty">
              No description
            </div>
          )}
        </div>

        <div className="detail-activity">
          <div className="detail-activity-title">Activity</div>
          <div className="detail-activity-placeholder">
            Activity timeline coming soon...
          </div>
        </div>
      </div>

      <div className="entry-detail-sidebar">
        <div className="field-row">
          <div className="field-label">Status</div>
          {editing ? (
            <select
              value={entry.status}
              onChange={(e) => updateField("status", e.target.value)}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          ) : (
            <div className="field-value">
              <StatusBadge status={entry.status} />
            </div>
          )}
        </div>

        <div className="field-row">
          <div className="field-label">Severity</div>
          {editing ? (
            <select
              value={entry.severity}
              onChange={(e) => updateField("severity", e.target.value)}
            >
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>
          ) : (
            <div className="field-value">
              <span className={`severity-${entry.severity}`}>
                {SEVERITY_LABELS[entry.severity] || entry.severity}
              </span>
            </div>
          )}
        </div>

        <div className="field-row">
          <div className="field-label">Group</div>
          {editing ? (
            <select
              value={entry.group}
              onChange={(e) => updateField("group", e.target.value)}
            >
              {(["incoming_control", "production", "client"] as EntryGroup[]).map(
                (g) => (
                  <option key={g} value={g}>
                    {GROUP_LABELS[g]}
                  </option>
                )
              )}
            </select>
          ) : (
            <div className="field-value">
              {GROUP_LABELS[entry.group as EntryGroup] || entry.group}
            </div>
          )}
        </div>

        <div className="field-row">
          <div className="field-label">Assigned To</div>
          {editing ? (
            <input
              className="inline-edit"
              value={entry.assigned_to || ""}
              placeholder="Unassigned"
              onChange={() => {}}
              onBlur={(e) => updateField("assigned_to", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") updateField("assigned_to", (e.target as HTMLInputElement).value);
              }}
            />
          ) : (
            <div className="field-value">
              {entry.assigned_to || <span style={{ color: "var(--text-muted)" }}>Unassigned</span>}
            </div>
          )}
        </div>

        <div className="field-row">
          <div className="field-label">Created</div>
          <div className="field-value">{fmt(created)}</div>
        </div>

        <div className="field-row">
          <div className="field-label">Updated</div>
          <div className="field-value">{fmt(updated)}</div>
        </div>

        {editing && (
          <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              Delete Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
