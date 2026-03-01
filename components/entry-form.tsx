"use client";

import { useState } from "react";
import type { CreateEntryInput, Entry, EntryGroup } from "@/lib/types";
import { GROUP_LABELS } from "@/lib/types";

interface Props {
  entry?: Entry;
  defaultGroup?: string;
  onSubmit: (data: CreateEntryInput) => Promise<void>;
  onClose: () => void;
}

const groups: EntryGroup[] = ["incoming_control", "production", "client"];

export default function EntryForm({
  entry,
  defaultGroup,
  onSubmit,
  onClose,
}: Props) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [severity, setSeverity] = useState(entry?.severity ?? "minor");
  const [group, setGroup] = useState(
    entry?.group ?? defaultGroup ?? "incoming_control"
  );
  const [assignedTo, setAssignedTo] = useState(entry?.assigned_to ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title,
        description,
        severity,
        group,
        assigned_to: assignedTo,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{entry ? "Edit Entry" : "New Entry"}</h2>
        {error && (
          <div style={{ color: "var(--error)", marginBottom: 12 }}>{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the nonconformity"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description, root cause, observations..."
            />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Group</label>
              <select value={group} onChange={(e) => setGroup(e.target.value)}>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {GROUP_LABELS[g]}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Assigned To</label>
            <input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="person.name"
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : entry ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
