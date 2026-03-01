import { getStats, listEntries } from "@/lib/entries";
import type { EntryGroup } from "@/lib/types";
import { GROUP_LABELS } from "@/lib/types";
import StatusBadge from "@/components/status-badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

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

export default async function Dashboard() {
  const [stats, recent] = await Promise.all([
    getStats(),
    listEntries({ page: 1, page_size: 8 }),
  ]);

  const statuses = ["open", "in_progress", "resolved", "closed"];
  const severities = ["critical", "major", "minor"];

  return (
    <div className="dashboard-grid">
      {/* Summary bar */}
      <div className="widget">
        <div className="summary-widget">
          <div className="summary-total">
            <div className="count">{stats.total}</div>
            <div className="label">Total</div>
          </div>
          <div className="summary-bar-container">
            <div className="summary-bar">
              {statuses.map((s) => {
                const count = stats.by_status[s] ?? 0;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div
                    key={s}
                    className="summary-bar-segment"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: STATUS_COLORS[s],
                    }}
                  />
                );
              })}
            </div>
            <div className="summary-bar-legend">
              {statuses.map((s) => (
                <div key={s} className="summary-legend-item">
                  <span
                    className="summary-legend-dot"
                    style={{ backgroundColor: STATUS_COLORS[s] }}
                  />
                  <span>{STATUS_LABELS[s]}</span>
                  <span className="summary-legend-count">
                    {stats.by_status[s] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status cards */}
      <div className="status-cards">
        {statuses.map((s) => {
          const count = stats.by_status[s] ?? 0;
          const pct =
            stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
          return (
            <div key={s} className="status-card">
              <div
                className="status-card-indicator"
                style={{ backgroundColor: STATUS_COLORS[s] }}
              />
              <div className="status-card-content">
                <div className="count">{count}</div>
                <div className="label">{STATUS_LABELS[s]}</div>
                <div className="pct">{pct}% of total</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Severity breakdown */}
      <div className="widget">
        <div className="widget-header">Severity Breakdown</div>
        <div className="widget-body">
          <div className="severity-bar-widget">
            {severities.map((sev) => {
              const count = stats.by_severity[sev] ?? 0;
              const pct =
                stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={sev} className="severity-bar-row">
                  <span className="severity-bar-label">{sev}</span>
                  <div className="severity-bar-track">
                    <div
                      className="severity-bar-fill"
                      style={{
                        width: `${Math.max(pct, count > 0 ? 2 : 0)}%`,
                        backgroundColor: SEVERITY_COLORS[sev],
                      }}
                    />
                  </div>
                  <span className="severity-bar-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Group cards */}
      {stats.by_group && (
        <div className="group-cards">
          {(["incoming_control", "production", "client"] as EntryGroup[]).map(
            (g) => (
              <div key={g} className="group-card">
                <div className="group-card-header">
                  <span className="name">{GROUP_LABELS[g]}</span>
                  <span className="count">{stats.by_group[g] ?? 0}</span>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Recent activity */}
      <div className="widget">
        <div className="widget-header">Recent Activity</div>
        {recent.data.length === 0 ? (
          <div className="widget-body">
            <div className="empty">
              <p>No entries yet. Create one to get started.</p>
            </div>
          </div>
        ) : (
          <div className="activity-list">
            {recent.data.map((e) => (
              <Link
                key={e.id}
                href={`/entries/detail/${e.id}`}
                className="activity-item"
              >
                <div
                  className="activity-severity-bar"
                  style={{
                    backgroundColor:
                      SEVERITY_COLORS[e.severity] || SEVERITY_COLORS.minor,
                  }}
                />
                <span className="activity-id">NC-{e.id}</span>
                <span className="activity-title">{e.title}</span>
                <div className="activity-meta">
                  <StatusBadge status={e.status} />
                  <span className="activity-time">
                    {timeAgo(e.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
