import type {
  Entry,
  CreateEntryInput,
  UpdateEntryInput,
  Status,
  Stats,
  PaginatedResponse,
  Comment,
  CreateCommentInput,
  AnalyticsResponse,
  WorkflowTemplate,
  WorkflowTemplateStep,
  WorkflowStep,
  UpdateWorkflowStepInput,
  WorkflowProgress,
  Attachment,
  Tag,
  CostSummary,
} from "./types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface ListParams {
  status?: string;
  severity?: string;
  search?: string;
  group?: string;
  tag?: string;
  page?: number;
  page_size?: number;
}

export const api = {
  entries: {
    list: (params?: ListParams) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.severity) qs.set("severity", params.severity);
      if (params?.search) qs.set("search", params.search);
      if (params?.group) qs.set("group", params.group);
      if (params?.tag) qs.set("tag", params.tag);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.page_size) qs.set("page_size", String(params.page_size));
      const query = qs.toString();
      return request<PaginatedResponse>(`/entries${query ? `?${query}` : ""}`);
    },
    get: (id: number) => request<Entry>(`/entries/${id}`),
    create: (input: CreateEntryInput) =>
      request<Entry>("/entries", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: number, input: UpdateEntryInput) =>
      request<Entry>(`/entries/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    updateStatus: (id: number, status: string) =>
      request<Entry>(`/entries/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    delete: (id: number) =>
      request<void>(`/entries/${id}`, { method: "DELETE" }),
    stats: () => request<Stats>("/entries/stats"),
    comments: (id: number) => request<Comment[]>(`/entries/${id}/comments`),
    addComment: (id: number, input: CreateCommentInput) =>
      request<Comment>(`/entries/${id}/comments`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    analytics: (groupBy?: "week" | "month") => {
      const qs = groupBy ? `?group_by=${groupBy}` : "";
      return request<AnalyticsResponse>(`/entries/analytics${qs}`);
    },
    exportUrl: (params?: ListParams) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.severity) qs.set("severity", params.severity);
      if (params?.group) qs.set("group", params.group);
      if (params?.search) qs.set("search", params.search);
      const query = qs.toString();
      return `/api/entries/export${query ? `?${query}` : ""}`;
    },
    workflow: (id: number) =>
      request<WorkflowStep[]>(`/entries/${id}/workflow`),
    assignWorkflow: (id: number, templateKey: string) =>
      request<WorkflowStep[]>(`/entries/${id}/workflow`, {
        method: "POST",
        body: JSON.stringify({ template_key: templateKey }),
      }),
    updateWorkflowStep: (id: number, stepId: number, input: UpdateWorkflowStepInput) =>
      request<WorkflowStep>(`/entries/${id}/workflow/${stepId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    workflowProgress: (id: number) => {
      // Derive progress client-side from steps to avoid extra endpoint
      return request<WorkflowStep[]>(`/entries/${id}/workflow`).then(
        (steps): WorkflowProgress => {
          if (steps.length === 0)
            return { total: 0, completed: 0, current_step: null, percent: 0 };
          const completed = steps.filter(
            (s) => s.status === "completed" || s.status === "skipped"
          ).length;
          const current = steps.find(
            (s) => s.status === "in_progress" || s.status === "pending"
          );
          return {
            total: steps.length,
            completed,
            current_step: current ? current.code : null,
            percent: Math.round((completed / steps.length) * 100),
          };
        }
      );
    },
    batchProgress: (ids: number[]) =>
      request<Record<number, WorkflowProgress>>(
        `/entries/batch-progress?ids=${ids.join(",")}`
      ),
    batchTags: (ids: number[]) =>
      request<Record<number, Tag[]>>(
        `/entries/batch-tags?ids=${ids.join(",")}`
      ),
    attachments: (id: number) =>
      request<Attachment[]>(`/entries/${id}/attachments`),
    uploadAttachment: async (id: number, file: File, uploadedBy?: string) => {
      const formData = new FormData();
      formData.append("file", file);
      if (uploadedBy) formData.append("uploaded_by", uploadedBy);
      const res = await fetch(`/api/entries/${id}/attachments`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || res.statusText);
      }
      return res.json() as Promise<Attachment>;
    },
    deleteAttachment: (attachmentId: number) =>
      request<void>(`/attachments/${attachmentId}`, { method: "DELETE" }),
    tags: (id: number) => request<Tag[]>(`/entries/${id}/tags`),
    setTags: (id: number, tagIds: number[]) =>
      request<Tag[]>(`/entries/${id}/tags`, {
        method: "PUT",
        body: JSON.stringify({ tag_ids: tagIds }),
      }),
  },
  statuses: {
    list: () => request<Status[]>("/statuses"),
  },
  tags: {
    list: () => request<Tag[]>("/tags"),
    create: (name: string, color?: string) =>
      request<Tag>("/tags", {
        method: "POST",
        body: JSON.stringify({ name, color }),
      }),
    delete: (id: number) =>
      request<void>(`/tags/${id}`, { method: "DELETE" }),
  },
  workflowTemplates: {
    list: () => request<WorkflowTemplate[]>("/workflow-templates"),
    get: (key: string) =>
      request<{ template: WorkflowTemplate; steps: WorkflowTemplateStep[] }>(
        `/workflow-templates/${key}`
      ),
  },
  costs: {
    summary: () => request<CostSummary>("/costs/summary"),
  },
};
