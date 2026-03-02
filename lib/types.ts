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

export type EntryGroup = "incoming_control" | "production" | "client";

export const GROUP_LABELS: Record<EntryGroup, string> = {
  incoming_control: "Incoming Control",
  production: "Production",
  client: "Client",
};
