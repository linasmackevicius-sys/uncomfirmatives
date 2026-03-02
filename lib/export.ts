import { db } from "./db";
import { entries } from "./schema";
import { eq, like, or, and, desc, type SQL } from "drizzle-orm";

interface ExportParams {
  status?: string;
  severity?: string;
  group?: string;
  search?: string;
}

export async function exportEntriesCsv(params: ExportParams): Promise<string> {
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

  const rows = await db
    .select()
    .from(entries)
    .where(where)
    .orderBy(desc(entries.createdAt));

  const headers = [
    "ID",
    "Title",
    "Description",
    "Status",
    "Severity",
    "Group",
    "Assigned To",
    "Root Cause",
    "Corrective Action",
    "Preventive Action",
    "Due Date",
    "Workflow Template",
    "Product Name",
    "Order Number",
    "Batch Number",
    "Estimated Cost",
    "Actual Cost",
    "Currency",
    "Created At",
    "Updated At",
  ];

  const csvRows = rows.map((row) => {
    const values = [
      row.id,
      escapeCsv(row.title),
      escapeCsv(row.description ?? ""),
      row.status ?? "open",
      row.severity ?? "minor",
      row.group ?? "incoming_control",
      escapeCsv(row.assignedTo ?? ""),
      escapeCsv(row.rootCause ?? ""),
      escapeCsv(row.correctiveAction ?? ""),
      escapeCsv(row.preventiveAction ?? ""),
      row.dueDate ?? "",
      row.workflowTemplateKey ?? "",
      escapeCsv(row.productName ?? ""),
      escapeCsv(row.orderNumber ?? ""),
      escapeCsv(row.batchNumber ?? ""),
      row.estimatedCost != null ? (row.estimatedCost / 100).toFixed(2) : "",
      row.actualCost != null ? (row.actualCost / 100).toFixed(2) : "",
      row.currency ?? "EUR",
      row.createdAt?.toISOString() ?? "",
      row.updatedAt?.toISOString() ?? "",
    ];
    return values.join(",");
  });

  return [headers.join(","), ...csvRows].join("\n");
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
