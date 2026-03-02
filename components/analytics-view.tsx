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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

const GROUP_COLORS: Record<string, string> = {
  incoming_control: "#818cf8",
  production: "#f59e0b",
  client: "#22c55e",
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

export default function AnalyticsView() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"week" | "month">("week");
  const [dateRange, setDateRange] = useState({
    from: daysAgo(90),
    to: today(),
  });

  const loadData = useCallback(async () => {
    if (!analytics) setLoading(true);
    try {
      const [a, s, c] = await Promise.all([
        api.entries.analytics(groupBy),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !analytics || !stats) {
    return (
      <div className="analytics-page">
        <div className="empty">
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const statusData = Object.entries(stats.by_status).map(([key, count]) => ({
    name: key.replace("_", " "),
    key,
    count,
  }));

  const severityData = Object.entries(stats.by_severity).map(
    ([key, count]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      key,
      count,
    })
  );

  const groupData = Object.entries(stats.by_group).map(([key, count]) => ({
    name: GROUP_LABELS[key as EntryGroup] || key,
    key,
    count,
  }));

  const totalOpen =
    (stats.by_status.open || 0) + (stats.by_status.in_progress || 0);

  const avgDays = analytics.avg_resolution_time_hours
    ? Math.round(analytics.avg_resolution_time_hours / 24)
    : null;

  // Filter entries_over_time to date range
  const filteredOverTime = analytics.entries_over_time.filter(
    (d) => d.date >= dateRange.from && d.date <= dateRange.to
  );

  return (
    <div className="analytics-page">
      <div className="analytics-toolbar">
        <h1 className="page-title">Analytics</h1>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <div className="view-toggle">
          <button
            className={`view-toggle-btn${groupBy === "week" ? " active" : ""}`}
            onClick={() => setGroupBy("week")}
          >
            Weekly
          </button>
          <button
            className={`view-toggle-btn${groupBy === "month" ? " active" : ""}`}
            onClick={() => setGroupBy("month")}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="analytics-stats">
        <div className="stat-card">
          <div className="label">Total Open</div>
          <div className="value">{totalOpen}</div>
        </div>
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
            {avgDays !== null ? `${avgDays}d` : "N/A"}
          </div>
        </div>
        {stats.workflow_completed_count + stats.workflow_in_progress_count > 0 && (
          <div className="stat-card">
            <div className="label">Workflows Done</div>
            <div className="value" style={{ color: "var(--success)" }}>
              {stats.workflow_completed_count}
              <span style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 400 }}>
                /{stats.workflow_completed_count + stats.workflow_in_progress_count}
              </span>
            </div>
          </div>
        )}
        {costSummary && costSummary.total_estimated > 0 && (
          <div className="stat-card">
            <div className="label">Total Cost</div>
            <div className={`value${costSummary.total_actual > costSummary.total_estimated ? " cost-over" : ""}`}>
              {new Intl.NumberFormat("en", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(costSummary.total_actual / 100)}
            </div>
          </div>
        )}
      </div>

      <div className="analytics-charts">
        <div className="widget">
          <div className="widget-header">Entries Over Time</div>
          <div className="widget-body chart-container">
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

        <div className="widget">
          <div className="widget-header">Status Distribution</div>
          <div className="widget-body chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Count">
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={STATUS_COLORS[entry.key] || "#818cf8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">Severity Distribution</div>
          <div className="widget-body chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {severityData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={SEVERITY_COLORS[entry.key] || "#818cf8"}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">Group Distribution</div>
          <div className="widget-body chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={groupData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Count">
                  {groupData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={GROUP_COLORS[entry.key] || "#818cf8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
