export interface Entry {
  id: number;
  title: string;
  description: string;
  status: string;
  severity: string;
  group: string;
  assigned_to: string;
  root_cause: string;
  corrective_action: string;
  preventive_action: string;
  due_date: string | null;
  workflow_template_key: string | null;
  product_name: string | null;
  order_number: string | null;
  batch_number: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Status {
  id: number;
  name: string;
  color: string;
  order: number;
}

export interface CreateEntryInput {
  title: string;
  description: string;
  severity: string;
  group: string;
  assigned_to: string;
  root_cause?: string;
  corrective_action?: string;
  preventive_action?: string;
  due_date?: string | null;
  workflow_template_key?: string;
  product_name?: string;
  order_number?: string;
  batch_number?: string;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  currency?: string;
}

export interface UpdateEntryInput {
  title?: string;
  description?: string;
  severity?: string;
  group?: string;
  assigned_to?: string;
  root_cause?: string;
  corrective_action?: string;
  preventive_action?: string;
  due_date?: string | null;
  workflow_template_key?: string;
  product_name?: string;
  order_number?: string;
  batch_number?: string;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  currency?: string;
}

export interface PaginatedResponse {
  data: Entry[];
  total: number;
  page: number;
  page_size: number;
}

export interface Stats {
  total: number;
  by_status: Record<string, number>;
  by_severity: Record<string, number>;
  by_group: Record<string, number>;
  total_estimated_cost: number;
  total_actual_cost: number;
  workflow_completed_count: number;
  workflow_in_progress_count: number;
}

export interface Comment {
  id: number;
  entry_id: number;
  author: string;
  content: string;
  created_at: string;
}

export interface CreateCommentInput {
  author: string;
  content: string;
}

export interface AnalyticsResponse {
  entries_over_time: { date: string; count: number }[];
  avg_resolution_time_hours: number | null;
  overdue_count: number;
  by_severity_over_time: { date: string; severity: string; count: number }[];
  by_group_over_time: { date: string; group: string; count: number }[];
}

export interface WorkflowTemplate {
  id: number;
  name: string;
  template_key: string;
  description: string | null;
  created_at: string;
}

export interface WorkflowTemplateStep {
  id: number;
  template_id: number;
  step_order: number;
  code: string;
  name: string;
  description: string | null;
  default_assignee: string | null;
  default_due_days: number | null;
}

export interface WorkflowStep {
  id: number;
  entry_id: number;
  template_step_id: number | null;
  step_order: number;
  code: string;
  name: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: string;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateWorkflowStepInput {
  status?: string;
  assigned_to?: string;
  notes?: string;
  due_date?: string | null;
}

export interface WorkflowProgress {
  total: number;
  completed: number;
  current_step: string | null;
  percent: number;
}

export interface Attachment {
  id: number;
  entry_id: number;
  filename: string;
  stored_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string | null;
}

export interface CostSummary {
  total_estimated: number;
  total_actual: number;
  by_severity: Record<string, { estimated: number; actual: number }>;
  by_group: Record<string, { estimated: number; actual: number }>;
}

export type EntryGroup = "incoming_control" | "production" | "client";

export const GROUP_LABELS: Record<EntryGroup, string> = {
  incoming_control: "Incoming Control",
  production: "Production",
  client: "Client",
};
