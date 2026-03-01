"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api-client";
import type { Entry } from "@/lib/types";
import BoardCard from "@/components/board-card";

const STATUS_COLORS: Record<string, string> = {
  open: "#3b82f6",
  in_progress: "#f59e0b",
  resolved: "#22c55e",
  closed: "#71717a",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUSES = ["open", "in_progress", "resolved", "closed"];

export default function BoardView() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const draggedId = useRef<number | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.entries.list({ page_size: 200 });
      setEntries(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleDragStart = (_e: React.DragEvent, id: number) => {
    draggedId.current = id;
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const id = draggedId.current;
    if (!id) return;
    draggedId.current = null;

    // Optimistic update
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, status } : entry
      )
    );

    try {
      await api.entries.updateStatus(id, status);
    } catch {
      loadEntries();
    }
  };

  const grouped = STATUSES.reduce(
    (acc, s) => {
      acc[s] = entries.filter((e) => e.status === s);
      return acc;
    },
    {} as Record<string, Entry[]>
  );

  if (loading) {
    return (
      <div className="empty">
        <p>Loading board...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "var(--error)", padding: 16 }}>{error}</div>
    );
  }

  return (
    <div className="board">
      {STATUSES.map((status) => (
        <div key={status} className="board-column">
          <div className="board-column-header">
            <div className="board-column-title">
              <span
                className="board-column-dot"
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              {STATUS_LABELS[status]}
            </div>
            <span className="board-column-count">
              {grouped[status].length}
            </span>
          </div>
          <div
            className={`board-column-body${dragOverColumn === status ? " drag-over" : ""}`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            {grouped[status].map((entry) => (
              <BoardCard
                key={entry.id}
                entry={entry}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
