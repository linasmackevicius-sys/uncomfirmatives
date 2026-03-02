import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/schema";
import { sql } from "drizzle-orm";
import type { CostSummary } from "@/lib/types";

export async function GET() {
  const [totals] = await db
    .select({
      totalEstimated: sql<number>`COALESCE(SUM(estimated_cost), 0)`,
      totalActual: sql<number>`COALESCE(SUM(actual_cost), 0)`,
    })
    .from(entries);

  const bySeverityRows = await db
    .select({
      severity: entries.severity,
      estimated: sql<number>`COALESCE(SUM(estimated_cost), 0)`,
      actual: sql<number>`COALESCE(SUM(actual_cost), 0)`,
    })
    .from(entries)
    .groupBy(entries.severity);

  const byGroupRows = await db
    .select({
      group: entries.group,
      estimated: sql<number>`COALESCE(SUM(estimated_cost), 0)`,
      actual: sql<number>`COALESCE(SUM(actual_cost), 0)`,
    })
    .from(entries)
    .groupBy(entries.group);

  const bySeverity: CostSummary["by_severity"] = {};
  for (const row of bySeverityRows) {
    bySeverity[row.severity ?? "minor"] = {
      estimated: row.estimated,
      actual: row.actual,
    };
  }

  const byGroup: CostSummary["by_group"] = {};
  for (const row of byGroupRows) {
    byGroup[row.group ?? "incoming_control"] = {
      estimated: row.estimated,
      actual: row.actual,
    };
  }

  const summary: CostSummary = {
    total_estimated: totals.totalEstimated,
    total_actual: totals.totalActual,
    by_severity: bySeverity,
    by_group: byGroup,
  };

  return NextResponse.json(summary);
}
