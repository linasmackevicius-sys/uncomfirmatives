import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  bigint,
  date,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const entries = mysqlTable("entries", {
  id: bigint("id", { mode: "number", unsigned: true })
    .primaryKey()
    .autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("open"),
  severity: varchar("severity", { length: 50 }).default("minor"),
  group: varchar("group", { length: 50 }).default("incoming_control"),
  assignedTo: varchar("assigned_to", { length: 255 }),
  rootCause: text("root_cause"),
  correctiveAction: text("corrective_action"),
  preventiveAction: text("preventive_action"),
  dueDate: date("due_date", { mode: "string" }),
  createdAt: timestamp("created_at").defaultNow(),
  workflowTemplateKey: varchar("workflow_template_key", { length: 50 }),
  productName: varchar("product_name", { length: 255 }),
  orderNumber: varchar("order_number", { length: 100 }),
  batchNumber: varchar("batch_number", { length: 100 }),
  estimatedCost: int("estimated_cost"),
  actualCost: int("actual_cost"),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const comments = mysqlTable("comments", {
  id: bigint("id", { mode: "number", unsigned: true })
    .primaryKey()
    .autoincrement(),
  entryId: bigint("entry_id", { mode: "number", unsigned: true }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const statuses = mysqlTable("statuses", {
  id: bigint("id", { mode: "number", unsigned: true })
    .primaryKey()
    .autoincrement(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  color: varchar("color", { length: 7 }).notNull(),
  order: int("order").notNull(),
});

export const users = mysqlTable("users", {
  id: bigint("id", { mode: "number", unsigned: true })
    .primaryKey()
    .autoincrement(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workflowTemplates = mysqlTable("workflow_templates", {
  id: bigint("id", { mode: "number", unsigned: true })
    .primaryKey()
    .autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  templateKey: varchar("template_key", { length: 50 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workflowTemplateSteps = mysqlTable("workflow_template_steps", {
  id: bigint("id", { mode: "number", unsigned: true })
    .primaryKey()
    .autoincrement(),
  templateId: bigint("template_id", { mode: "number", unsigned: true }).notNull(),
  stepOrder: int("step_order").notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  defaultAssignee: varchar("default_assignee", { length: 255 }),
  defaultDueDays: int("default_due_days"),
});

export const workflowSteps = mysqlTable("workflow_steps", {
  id: bigint("id", { mode: "number", unsigned: true })
    .primaryKey()
    .autoincrement(),
  entryId: bigint("entry_id", { mode: "number", unsigned: true }).notNull(),
  templateStepId: bigint("template_step_id", { mode: "number", unsigned: true }),
  stepOrder: int("step_order").notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  assignedTo: varchar("assigned_to", { length: 255 }),
  dueDate: date("due_date", { mode: "string" }),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const attachments = mysqlTable("attachments", {
  id: bigint("id", { mode: "number", unsigned: true })
    .primaryKey()
    .autoincrement(),
  entryId: bigint("entry_id", { mode: "number", unsigned: true }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  storedPath: varchar("stored_path", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  sizeBytes: int("size_bytes"),
  uploadedBy: varchar("uploaded_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = mysqlTable("tags", {
  id: bigint("id", { mode: "number", unsigned: true })
    .primaryKey()
    .autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  color: varchar("color", { length: 7 }),
});

export const entryTags = mysqlTable(
  "entry_tags",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    entryId: bigint("entry_id", { mode: "number", unsigned: true }).notNull(),
    tagId: bigint("tag_id", { mode: "number", unsigned: true }).notNull(),
  },
  (table) => [
    uniqueIndex("entry_tag_unique").on(table.entryId, table.tagId),
  ]
);