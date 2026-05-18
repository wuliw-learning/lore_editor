export type User = {
  username: string
}

export type BreadcrumbItem = {
  id: number
  title: string
}

export type Page = {
  id: number
  title: string
  parent_id: number | null
  is_favorite: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type PageDetail = Page & {
  breadcrumbs: BreadcrumbItem[]
}

export type Block = {
  id: number
  page_id: number
  type: string
  content: string
  metadata: Record<string, unknown>
  sort_order: number
  created_at: string
  updated_at: string
}

export type SearchResult = {
  page_id: number
  page_title: string
  snippet: string
  match_type: string
}

export type UploadedFile = {
  id: number
  original_name: string
  stored_name: string
  size: number
  mime_type: string
  created_at: string
}

export type TaskStatus = 'active' | 'completed' | 'backlog'

export type TaskEntry = {
  id: number
  task_date: string
  title: string
  description: string
  status: TaskStatus
  origin_created_at: string
  previous_entry_id: number | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type TaskDayResponse = {
  task_date: string
  items: TaskEntry[]
}

export type TaskCalendarDay = {
  task_date: string
  total_count: number
  completed_count: number
  active_count: number
  backlog_count: number
}
