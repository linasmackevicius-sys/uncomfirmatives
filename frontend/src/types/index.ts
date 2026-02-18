export interface Entry {
  id: number
  title: string
  description: string
  status: string
  severity: string
  group: string
  assigned_to: string
  created_at: string
  updated_at: string
}

export interface Status {
  id: number
  name: string
  color: string
  order: number
}

export interface CreateEntryInput {
  title: string
  description: string
  severity: string
  group: string
  assigned_to: string
}

export interface UpdateEntryInput {
  title?: string
  description?: string
  severity?: string
  group?: string
  assigned_to?: string
}

export interface PaginatedResponse {
  data: Entry[]
  total: number
  page: number
  page_size: number
}

export interface Stats {
  total: number
  by_status: Record<string, number>
  by_severity: Record<string, number>
  by_group: Record<string, number>
}

export type EntryGroup = 'incoming_control' | 'production' | 'client'

export const GROUP_LABELS: Record<EntryGroup, string> = {
  incoming_control: 'Incoming Control',
  production: 'Production',
  client: 'Client',
}
