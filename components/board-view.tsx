"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api-client";
import { useEntryEvents } from "@/hooks/use-entry-events";
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
  done: "Done",
};

type BoardColumn = "open" | "in_progress" | "done";
const COLUMNS: BoardColumn[] = ["open", "in_progress", "done"];

export default function BoardView() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverSubZone, setDragOverSubZone] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const draggedId = useRef<number | null>(null);

  const loadEntries = useCallback(async () => {
    if (entries.length === 0) setLoading(true);
    try {
      const result = await api.entries.list({ page_size: 200 });
      setEntries(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEntryEvents(loadEntries);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleDragStart = (_e: React.DragEvent, id: number) => {
    draggedId.current = id;
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverColumn(null);
    setDragOverSubZone(null);
    draggedId.current = null;
  };

  const handleDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(column);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const applyStatus = async (id: number, status: string) => {
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

  const handleDrop = async (e: React.DragEvent, column: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    setIsDragging(false);
    const id = draggedId.current;
    if (!id) return;
    draggedId.current = null;

    if (column !== "done") {
      await applyStatus(id, column);
    }
    // For "done" column, drops are handled by sub-zones
  };

  const handleSubZoneDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);
    setDragOverSubZone(null);
    setIsDragging(false);
    const id = draggedId.current;
    if (!id) return;
    draggedId.current = null;

    await applyStatus(id, status);
  };

  const handleSubZoneDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn("done");
    setDragOverSubZone(status);
  };

  const handleSubZoneDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverSubZone(null);
  };

  const grouped: Record<BoardColumn, Entry[]> = {
    open: entries.filter((e) => e.status === "open"),
    in_progress: entries.filter((e) => e.status === "in_progress"),
    done: entries.filter((e) => e.status === "resolved" || e.status === "closed"),
  };

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

  const isDraggingToDone = isDragging && dragOverColumn === "done";

  return (
    <div className="board">
      {COLUMNS.map((column) => (
        <div key={column} className="board-column">
          <div className="board-column-header">
            <div className="board-column-title">
              <span
                className="board-column-dot"
                style={{
                  backgroundColor:
                    column === "done"
                      ? STATUS_COLORS.resolved
                      : STATUS_COLORS[column],
                }}
              />
              {STATUS_LABELS[column]}
            </div>
            <span className="board-column-count">
              {grouped[column].length}
            </span>
          </div>

          {column === "done" && isDragging && !grouped.done.some((e) => e.id === draggedId.current) ? (
            <div
              className="board-column-body board-done-split"
              onDragOver={(e) => handleDragOver(e, column)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column)}
            >
              <div
                className={`board-done-zone${dragOverSubZone === "resolved" ? " zone-active" : ""}`}
                onDragOver={(e) => handleSubZoneDragOver(e, "resolved")}
                onDragLeave={handleSubZoneDragLeave}
                onDrop={(e) => handleSubZoneDrop(e, "resolved")}
              >
                <span
                  className="board-column-dot"
                  style={{ backgroundColor: STATUS_COLORS.resolved }}
                />
                <span className="board-done-zone-label">Resolved</span>
              </div>
              <div
                className={`board-done-zone${dragOverSubZone === "closed" ? " zone-active" : ""}`}
                onDragOver={(e) => handleSubZoneDragOver(e, "closed")}
                onDragLeave={handleSubZoneDragLeave}
                onDrop={(e) => handleSubZoneDrop(e, "closed")}
              >
                <span
                  className="board-column-dot"
                  style={{ backgroundColor: STATUS_COLORS.closed }}
                />
                <span className="board-done-zone-label">Closed</span>
              </div>
            </div>
          ) : (
            <div
              className={`board-column-body${dragOverColumn === column ? " drag-over" : ""}`}
              onDragOver={(e) => handleDragOver(e, column)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column)}
            >
              {grouped[column].map((entry) => (
                <BoardCard
                  key={entry.id}
                  entry={entry}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  showStatus={column === "done"}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
