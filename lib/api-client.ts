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
  },
  statuses: {
    list: () => request<Status[]>("/statuses"),
  },
};
