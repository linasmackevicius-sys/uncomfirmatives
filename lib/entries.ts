import { db } from "./db";
import { entries } from "./schema";
import { eq, like, or, and, sql, desc, asc, type SQL } from "drizzle-orm";
import { VALID_STATUSES, VALID_SEVERITIES, VALID_GROUPS } from "./validation";
import type {
  Entry,
  CreateEntryInput,
  UpdateEntryInput,
  PaginatedResponse,
  Stats,
} from "./types";

export class EntryNotFoundError extends Error {
  constructor() {
    super("entry not found");
  }
}

export class ValidationError extends Error {}

interface ListParams {
  status?: string;
  severity?: string;
  search?: string;
  group?: string;
  page?: number;
  page_size?: number;
}

function toEntry(row: typeof entries.$inferSelect): Entry {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    status: row.status ?? "open",
    severity: row.severity ?? "minor",
    group: row.group ?? "incoming_control",
    assigned_to: row.assignedTo ?? "",
    root_cause: row.rootCause ?? "",
    corrective_action: row.correctiveAction ?? "",
    preventive_action: row.preventiveAction ?? "",
    due_date: row.dueDate ?? null,
    created_at: row.createdAt?.toISOString() ?? "",
    updated_at: row.updatedAt?.toISOString() ?? "",
  };
}

export async function listEntries(
  params: ListParams
): Promise<PaginatedResponse> {
  const conditions: SQL[] = [];

  if (params.status) conditions.push(eq(entries.status, params.status));
  if (params.severity) conditions.push(eq(entries.severity, params.severity));
  if (params.group) conditions.push(eq(entries.group, params.group));
  if (params.search) {
    const pattern = `%${params.search}%`;
    conditions.push(
      or(like(entries.title, pattern), like(entries.description, pattern))!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(entries)
    .where(where);
  const total = countResult.count;

  let page = params.page ?? 1;
  if (page < 1) page = 1;
  let pageSize = params.page_size ?? 10;
  if (pageSize < 1) pageSize = 10;
  if (pageSize > 200) pageSize = 200;

  const offset = (page - 1) * pageSize;

  const rows = await db
    .select()
    .from(entries)
    .where(where)
    .orderBy(desc(entries.createdAt))
    .offset(offset)
    .limit(pageSize);

  return {
    data: rows.map(toEntry),
    total,
    page,
    page_size: pageSize,
  };
}

export async function getEntryById(id: number): Promise<Entry> {
  const [row] = await db.select().from(entries).where(eq(entries.id, id));
  if (!row) throw new EntryNotFoundError();
  return toEntry(row);
}

export async function createEntry(input: CreateEntryInput): Promise<Entry> {
  if (!input.title) throw new ValidationError("title is required");

  const severity = input.severity || "minor";
  if (!VALID_SEVERITIES.has(severity))
    throw new ValidationError(
      "invalid severity: must be minor, major, or critical"
    );

  const group = input.group || "incoming_control";
  if (!VALID_GROUPS.has(group))
    throw new ValidationError(
      "invalid group: must be incoming_control, production, or client"
    );

  if (input.due_date !== undefined && input.due_date !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.due_date)) {
      throw new ValidationError("invalid due_date: must be YYYY-MM-DD");
    }
  }

  const [result] = await db.insert(entries).values({
    title: input.title,
    description: input.description || null,
    status: "open",
    severity,
    group,
    assignedTo: input.assigned_to || null,
    rootCause: input.root_cause || null,
    correctiveAction: input.corrective_action || null,
    preventiveAction: input.preventive_action || null,
    dueDate: input.due_date || null,
  });

  return getEntryById(result.insertId);
}

export async function updateEntry(
  id: number,
  input: UpdateEntryInput
): Promise<Entry> {
  const existing = await getEntryById(id);

  const updates: Partial<typeof entries.$inferInsert> = {};

  if (input.title !== undefined) {
    if (!input.title) throw new ValidationError("title is required");
    updates.title = input.title;
  }
  if (input.description !== undefined) {
    updates.description = input.description || null;
  }
  if (input.severity !== undefined) {
    if (!VALID_SEVERITIES.has(input.severity))
      throw new ValidationError(
        "invalid severity: must be minor, major, or critical"
      );
    updates.severity = input.severity;
  }
  if (input.group !== undefined) {
    if (!VALID_GROUPS.has(input.group))
      throw new ValidationError(
        "invalid group: must be incoming_control, production, or client"
      );
    updates.group = input.group;
  }
  if (input.assigned_to !== undefined) {
    updates.assignedTo = input.assigned_to || null;
  }
  if (input.root_cause !== undefined) {
    updates.rootCause = input.root_cause || null;
  }
  if (input.corrective_action !== undefined) {
    updates.correctiveAction = input.corrective_action || null;
  }
  if (input.preventive_action !== undefined) {
    updates.preventiveAction = input.preventive_action || null;
  }
  if (input.due_date !== undefined) {
    if (input.due_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(input.due_date)) {
      throw new ValidationError("invalid due_date: must be YYYY-MM-DD");
    }
    updates.dueDate = input.due_date;
  }

  if (Object.keys(updates).length > 0) {
    await db.update(entries).set(updates).where(eq(entries.id, id));
  }

  return getEntryById(id);
}

export async function updateEntryStatus(
  id: number,
  status: string
): Promise<Entry> {
  if (!VALID_STATUSES.has(status))
    throw new ValidationError("invalid status");

  await getEntryById(id); // ensures exists
  await db.update(entries).set({ status }).where(eq(entries.id, id));
  return getEntryById(id);
}

export async function deleteEntry(id: number): Promise<void> {
  await getEntryById(id); // ensures exists
  await db.delete(entries).where(eq(entries.id, id));
}

export async function getStats(): Promise<Stats> {
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(entries);

  const byStatusRows = await db
    .select({
      status: entries.status,
      count: sql<number>`count(*)`,
    })
    .from(entries)
    .groupBy(entries.status);

  const bySeverityRows = await db
    .select({
      severity: entries.severity,
      count: sql<number>`count(*)`,
    })
    .from(entries)
    .groupBy(entries.severity);

  const byGroupRows = await db
    .select({
      group: entries.group,
      count: sql<number>`count(*)`,
    })
    .from(entries)
    .groupBy(entries.group);

  const byStatus: Record<string, number> = {};
  for (const row of byStatusRows) {
    byStatus[row.status ?? "open"] = row.count;
  }

  const bySeverity: Record<string, number> = {};
  for (const row of bySeverityRows) {
    bySeverity[row.severity ?? "minor"] = row.count;
  }

  const byGroup: Record<string, number> = {};
  for (const row of byGroupRows) {
    byGroup[row.group ?? "incoming_control"] = row.count;
  }

  return {
    total: totalResult.count,
    by_status: byStatus,
    by_severity: bySeverity,
    by_group: byGroup,
  };
}