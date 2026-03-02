"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useEntryEvents } from "@/hooks/use-entry-events";
import StatusBadge from "@/components/status-badge";
import type { Stats, Entry, EntryGroup, AnalyticsResponse, CostSummary } from "@/lib/types";
import { GROUP_LABELS } from "@/lib/types";
import { ResponsiveContainer, LineChart, Line } from "recharts";

function formatCost(cents: number): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

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

const STATUSES = ["open", "in_progress", "resolved", "closed"];
const SEVERITIES = ["critical", "major", "minor"];

export default function DashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Entry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [s, r, a, c] = await Promise.all([
        api.entries.stats(),
        api.entries.list({ page: 1, page_size: 8 }),
        api.entries.analytics("week"),
        api.costs.summary().catch(() => null),
      ]);
      setStats(s);
      setRecent(r.data);
      setAnalytics(a);
      setCostSummary(c);
    } catch {
      // silently fail on refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEntryEvents(refresh);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading || !stats) {
    return (
      <div className="empty">
        <p>Loading dashboard...</p>
      </div>
    );
  }

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
              {STATUSES.map((s) => {
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
              {STATUSES.map((s) => (
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
        {STATUSES.map((s) => {
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

      {/* Extra stats: overdue + avg resolution + sparkline */}
      {analytics && (
        <>
          <div className="dashboard-extra-stats">
            <div className="stat-card">
              <div className="label">Overdue</div>
              <div
                className="value"
                style={{
                  color: analytics.overdue_count > 0 ? "#ef4444" : undefined,
                }}
              >
                {analytics.overdue_count}
              </div>
            </div>
            <div className="stat-card">
              <div className="label">Avg Resolution</div>
              <div className="value">
                {analytics.avg_resolution_time_hours
                  ? `${Math.round(analytics.avg_resolution_time_hours / 24)}d`
                  : "N/A"}
              </div>
            </div>
          </div>
          {analytics.entries_over_time.length > 1 && (
            <div className="widget">
              <div className="widget-header">Trend (last weeks)</div>
              <div className="widget-body dashboard-sparkline">
                <ResponsiveContainer width="100%" height={60}>
                  <LineChart data={analytics.entries_over_time.slice(-12)}>
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#818cf8"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* Severity breakdown */}
      <div className="widget">
        <div className="widget-header">Severity Breakdown</div>
        <div className="widget-body">
          <div className="severity-bar-widget">
            {SEVERITIES.map((sev) => {
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

      {/* Financial Impact */}
      {costSummary && (costSummary.total_estimated > 0 || costSummary.total_actual > 0) && (
        <div className="widget">
          <div className="widget-header">Financial Impact</div>
          <div className="widget-body">
            <div className="financial-summary">
              <div className="financial-item">
                <div className="label">Estimated</div>
                <div className="value">{formatCost(costSummary.total_estimated)}</div>
              </div>
              <div className="financial-item">
                <div className={`value${costSummary.total_actual > costSummary.total_estimated ? " cost-over" : ""}`}>
                  {formatCost(costSummary.total_actual)}
                </div>
                <div className="label">Actual</div>
              </div>
            </div>
            {Object.keys(costSummary.by_severity).length > 0 && (
              <div className="financial-by-severity">
                {SEVERITIES.map((sev) => {
                  const data = costSummary.by_severity[sev];
                  if (!data) return null;
                  return (
                    <div key={sev} className="financial-severity-row">
                      <span className={`severity-${sev}`}>{sev}</span>
                      <span className="financial-cost">{formatCost(data.estimated)}</span>
                      <span className="financial-cost">{formatCost(data.actual)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workflow Progress */}
      {stats && (stats.workflow_completed_count > 0 || stats.workflow_in_progress_count > 0) && (
        <div className="widget">
          <div className="widget-header">Workflow Progress</div>
          <div className="widget-body">
            <div className="workflow-progress-widget">
              <div className="workflow-progress-bar-container">
                <div className="workflow-progress-bar">
                  <div
                    className="workflow-progress-fill"
                    style={{
                      width: `${
                        stats.workflow_completed_count + stats.workflow_in_progress_count > 0
                          ? (stats.workflow_completed_count /
                              (stats.workflow_completed_count + stats.workflow_in_progress_count)) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div className="workflow-progress-counts">
                <div className="workflow-progress-count">
                  <span className="value" style={{ color: "var(--success)" }}>
                    {stats.workflow_completed_count}
                  </span>
                  <span className="label">Completed</span>
                </div>
                <div className="workflow-progress-count">
                  <span className="value" style={{ color: "var(--warning)" }}>
                    {stats.workflow_in_progress_count}
                  </span>
                  <span className="label">In Progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="widget">
        <div className="widget-header">Recent Activity</div>
        {recent.length === 0 ? (
          <div className="widget-body">
            <div className="empty">
              <p>No entries yet. Create one to get started.</p>
            </div>
          </div>
        ) : (
          <div className="activity-list">
            {recent.map((e) => (
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
