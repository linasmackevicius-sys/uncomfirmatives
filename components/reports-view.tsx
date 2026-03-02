"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { AnalyticsResponse, Stats, CostSummary } from "@/lib/types";
import { GROUP_LABELS, type EntryGroup } from "@/lib/types";
import DateRangePicker from "@/components/date-range-picker";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  open: "#3b82f6",
  in_progress: "#f59e0b",
  resolved: "#22c55e",
  closed: "#71717a",
};

const SEVERITY_COLORS: Record<string, string> = {
  minor: "#3b82f6",
  major: "#f59e0b",
  critical: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const tooltipStyle = {
  backgroundColor: "#27272a",
  border: "1px solid #3f3f46",
  borderRadius: 6,
  color: "#e4e4e7",
  fontSize: 12,
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ReportsView() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: daysAgo(90),
    to: today(),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [a, s, c] = await Promise.all([
        api.entries.analytics("month"),
        api.entries.stats(),
        api.costs.summary().catch(() => null),
      ]);
      setAnalytics(a);
      setStats(s);
      setCostSummary(c);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleExportCSV() {
    const url = api.entries.exportUrl();
    window.open(url, "_blank");
  }

  function handlePrint() {
    window.print();
  }

  if (loading || !analytics || !stats) {
    return (
      <div className="reports-page">
        <div className="empty">
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  const totalOpen =
    (stats.by_status.open || 0) + (stats.by_status.in_progress || 0);

  const avgDays = analytics.avg_resolution_time_hours
    ? Math.round(analytics.avg_resolution_time_hours / 24)
    : null;

  const filteredOverTime = analytics.entries_over_time.filter(
    (d) => d.date >= dateRange.from && d.date <= dateRange.to
  );

  const maxSeverity = Math.max(
    ...Object.values(stats.by_severity),
    1
  );

  return (
    <div className="reports-page">
      <div className="reports-toolbar no-print">
        <h1 className="page-title">Reports</h1>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <button className="btn btn-secondary" onClick={handleExportCSV}>
          Export CSV
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          Print
        </button>
      </div>

      <div className="report-hero">
        <div className="report-hero-card">
          <div className="report-hero-value">{stats.total}</div>
          <div className="report-hero-label">Total Entries</div>
        </div>
        <div className="report-hero-card">
          <div className="report-hero-value">{totalOpen}</div>
          <div className="report-hero-label">Open</div>
        </div>
        <div className={`report-hero-card${analytics.overdue_count > 0 ? " accent" : ""}`}>
          <div className="report-hero-value">{analytics.overdue_count}</div>
          <div className="report-hero-label">Overdue</div>
        </div>
        <div className="report-hero-card">
          <div className="report-hero-value">
            {avgDays !== null ? (
              <>
                {avgDays}
                <span className="report-hero-unit">days</span>
              </>
            ) : (
              "N/A"
            )}
          </div>
          <div className="report-hero-label">Avg Resolution</div>
        </div>
      </div>

      <div className="report-section">
        <div className="report-section-title">Status Breakdown</div>
        <div className="report-status-grid">
          {(["open", "in_progress", "resolved", "closed"] as const).map(
            (status) => (
              <div key={status} className="report-status-item">
                <div
                  className="report-status-count"
                  style={{ color: STATUS_COLORS[status] }}
                >
                  {stats.by_status[status] || 0}
                </div>
                <div className="report-status-label">
                  {STATUS_LABELS[status]}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div className="report-section">
        <div className="report-section-title">Severity Breakdown</div>
        <div className="report-severity-bars">
          {(["critical", "major", "minor"] as const).map((sev) => {
            const count = stats.by_severity[sev] || 0;
            const pct = maxSeverity > 0 ? (count / maxSeverity) * 100 : 0;
            return (
              <div key={sev} className="report-severity-row">
                <div className="report-severity-label">{sev}</div>
                <div className="report-severity-track">
                  <div
                    className="report-severity-fill"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: SEVERITY_COLORS[sev],
                    }}
                  />
                </div>
                <div className="report-severity-count">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="report-section">
        <div className="report-section-title">By Group</div>
        <div className="report-group-grid">
          {(
            ["incoming_control", "production", "client"] as EntryGroup[]
          ).map((g) => (
            <div key={g} className="report-group-item">
              <div className="report-group-count">
                {stats.by_group[g] || 0}
              </div>
              <div className="report-group-label">{GROUP_LABELS[g]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary */}
      {costSummary && (costSummary.total_estimated > 0 || costSummary.total_actual > 0) && (
        <div className="report-section">
          <div className="report-section-title">Financial Summary</div>
          <div className="report-status-grid">
            <div className="report-status-item">
              <div className="report-status-count">
                {new Intl.NumberFormat("en", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(costSummary.total_estimated / 100)}
              </div>
              <div className="report-status-label">Estimated Cost</div>
            </div>
            <div className="report-status-item">
              <div
                className="report-status-count"
                style={{ color: costSummary.total_actual > costSummary.total_estimated ? "#ef4444" : undefined }}
              >
                {new Intl.NumberFormat("en", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(costSummary.total_actual / 100)}
              </div>
              <div className="report-status-label">Actual Cost</div>
            </div>
            <div className="report-status-item">
              <div
                className="report-status-count"
                style={{ color: costSummary.total_actual > costSummary.total_estimated ? "#ef4444" : "#22c55e" }}
              >
                {new Intl.NumberFormat("en", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format((costSummary.total_actual - costSummary.total_estimated) / 100)}
              </div>
              <div className="report-status-label">Variance</div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Status Overview */}
      {stats && (stats.workflow_completed_count > 0 || stats.workflow_in_progress_count > 0) && (
        <div className="report-section">
          <div className="report-section-title">Workflow Status Overview</div>
          <div className="report-status-grid">
            <div className="report-status-item">
              <div className="report-status-count" style={{ color: "#22c55e" }}>
                {stats.workflow_completed_count}
              </div>
              <div className="report-status-label">Completed</div>
            </div>
            <div className="report-status-item">
              <div className="report-status-count" style={{ color: "#f59e0b" }}>
                {stats.workflow_in_progress_count}
              </div>
              <div className="report-status-label">In Progress</div>
            </div>
            <div className="report-status-item">
              <div className="report-status-count">
                {Math.round(
                  (stats.workflow_completed_count /
                    Math.max(stats.workflow_completed_count + stats.workflow_in_progress_count, 1)) *
                    100
                )}%
              </div>
              <div className="report-status-label">Completion Rate</div>
            </div>
          </div>
        </div>
      )}

      <div className="report-section no-print">
        <div className="report-section-title">Trend</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis
              dataKey="date"
              stroke="#71717a"
              fontSize={12}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis stroke="#71717a" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#818cf8"
              strokeWidth={2}
              dot={false}
              name="Entries"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
