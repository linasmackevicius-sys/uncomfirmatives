import { db } from "./db";
import { entries } from "./schema";
import { sql, and, isNotNull } from "drizzle-orm";
import type { AnalyticsResponse } from "./types";

interface AnalyticsParams {
  group_by?: "week" | "month";
}

export async function getAnalytics(
  params: AnalyticsParams = {}
): Promise<AnalyticsResponse> {
  const groupBy = params.group_by === "month" ? "month" : "week";

  const dateExpr =
    groupBy === "month"
      ? sql`DATE_FORMAT(created_at, '%Y-%m-01')`
      : sql`DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY))`;

  const overTimeRows = await db
    .select({
      date: dateExpr.as("date"),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(entries)
    .groupBy(dateExpr)
    .orderBy(dateExpr);

  const [avgRow] = await db
    .select({
      avg_hours: sql<number | null>`
        AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at))
      `.as("avg_hours"),
    })
    .from(entries)
    .where(sql`status IN ('resolved', 'closed')`);

  const [overdueRow] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(entries)
    .where(
      and(
        isNotNull(entries.dueDate),
        sql`due_date < CURDATE()`,
        sql`status NOT IN ('resolved', 'closed')`
      )
    );

  const bySeverityRows = await db
    .select({
      date: dateExpr.as("date"),
      severity: entries.severity,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(entries)
    .groupBy(dateExpr, entries.severity)
    .orderBy(dateExpr);

  const byGroupRows = await db
    .select({
      date: dateExpr.as("date"),
      group: entries.group,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(entries)
    .groupBy(dateExpr, entries.group)
    .orderBy(dateExpr);

  return {
    entries_over_time: overTimeRows.map((r) => ({
      date: String(r.date),
      count: r.count,
    })),
    avg_resolution_time_hours: avgRow.avg_hours ?? null,
    overdue_count: overdueRow.count,
    by_severity_over_time: bySeverityRows.map((r) => ({
      date: String(r.date),
      severity: r.severity ?? "minor",
      count: r.count,
    })),
    by_group_over_time: byGroupRows.map((r) => ({
      date: String(r.date),
      group: r.group ?? "incoming_control",
      count: r.count,
    })),
  };
}
