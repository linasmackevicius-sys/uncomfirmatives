"use client";

import type { Entry, EntryGroup } from "@/lib/types";
import { GROUP_LABELS } from "@/lib/types";
import StatusBadge from "@/components/status-badge";
import Link from "next/link";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  major: "#f59e0b",
  minor: "#3b82f6",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface Props {
  entries: Entry[];
}

export default function EntryList({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="empty">
        <h3>No entries yet</h3>
        <p>Create your first nonconformity entry to get started.</p>
      </div>
    );
  }

  return (
    <div className="entry-list">
      {entries.map((entry) => (
        <Link
          key={entry.id}
          href={`/entries/detail/${entry.id}`}
          className="entry-list-item"
        >
          <div
            className="entry-list-severity"
            style={{
              backgroundColor:
                SEVERITY_COLORS[entry.severity] || SEVERITY_COLORS.minor,
            }}
          />
          <div className="entry-list-main">
            <div className="entry-list-top">
              <span className="entry-list-id">NC-{entry.id}</span>
              <span className="entry-list-title">{entry.title}</span>
            </div>
            {entry.description && (
              <div className="entry-list-desc">{entry.description}</div>
            )}
          </div>
          <div className="entry-list-meta">
            <StatusBadge status={entry.status} />
            {entry.assigned_to && (
              <span className="entry-list-assignee">{entry.assigned_to}</span>
            )}
            <span className="entry-list-time">{timeAgo(entry.created_at)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
