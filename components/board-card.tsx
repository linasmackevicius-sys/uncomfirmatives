"use client";

import type { Entry, EntryGroup } from "@/lib/types";
import { GROUP_LABELS } from "@/lib/types";
import Link from "next/link";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  major: "#f59e0b",
  minor: "#3b82f6",
};

interface Props {
  entry: Entry;
  onDragStart: (e: React.DragEvent, id: number) => void;
}

export default function BoardCard({ entry, onDragStart }: Props) {
  return (
    <Link
      href={`/entries/detail/${entry.id}`}
      className="board-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(e, entry.id);
      }}
      onClick={(e) => e.stopPropagation()}
      style={{ textDecoration: "none" }}
    >
      <div className="board-card-header">
        <span className="board-card-id">NC-{entry.id}</span>
        <span
          className="board-card-severity"
          style={{
            backgroundColor:
              SEVERITY_COLORS[entry.severity] || SEVERITY_COLORS.minor,
          }}
        />
      </div>
      <div className="board-card-title">{entry.title}</div>
      <div className="board-card-footer">
        <span className="board-card-group">
          {GROUP_LABELS[entry.group as EntryGroup] || entry.group}
        </span>
        {entry.assigned_to && (
          <span className="board-card-assignee">{entry.assigned_to}</span>
        )}
      </div>
    </Link>
  );
}
