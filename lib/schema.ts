import {
  pgTable,
  integer,
  varchar,
  text,
  timestamp,
  date,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
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
  estimatedCost: integer("estimated_cost"),
  actualCost: integer("actual_cost"),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const statuses = pgTable("statuses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  color: varchar("color", { length: 7 }).notNull(),
  order: integer("order").notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workflowTemplates = pgTable("workflow_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  templateKey: varchar("template_key", { length: 50 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workflowTemplateSteps = pgTable("workflow_template_steps", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  stepOrder: integer("step_order").notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  defaultAssignee: varchar("default_assignee", { length: 255 }),
  defaultDueDays: integer("default_due_days"),
});

export const workflowSteps = pgTable("workflow_steps", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull(),
  templateStepId: integer("template_step_id"),
  stepOrder: integer("step_order").notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  assignedTo: varchar("assigned_to", { length: 255 }),
  dueDate: date("due_date", { mode: "string" }),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  storedPath: varchar("stored_path", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  sizeBytes: integer("size_bytes"),
  uploadedBy: varchar("uploaded_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  color: varchar("color", { length: 7 }),
});

export const entryTags = pgTable(
  "entry_tags",
  {
    id: serial("id").primaryKey(),
    entryId: integer("entry_id").notNull(),
    tagId: integer("tag_id").notNull(),
  },
  (table) => [
    uniqueIndex("entry_tag_unique").on(table.entryId, table.tagId),
  ]
);
