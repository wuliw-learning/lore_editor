import type { TaskCalendarDay, TaskDayResponse, TaskEntry } from '../types'
import { api } from './client'

export function syncTasks(taskDate: string) {
  return api<{ status: string; task_date: string; created_entries: number }>('/api/tasks/sync', {
    method: 'POST',
    body: JSON.stringify({ task_date: taskDate }),
  })
}

export function getTasksForDay(taskDate: string) {
  return api<TaskDayResponse>(`/api/tasks/day/${taskDate}`)
}

export function createTask(taskDate: string, title: string, description = '') {
  return api<TaskEntry>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ task_date: taskDate, title, description }),
  })
}

export function updateTask(taskId: number, payload: Partial<Pick<TaskEntry, 'title' | 'description' | 'status' | 'sort_order'>>) {
  return api<TaskEntry>(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getBacklogTasks() {
  return api<TaskEntry[]>('/api/tasks/backlog')
}

export function getTaskCalendar(month: string) {
  return api<{ month: string; days: TaskCalendarDay[] }>(`/api/tasks/calendar?month=${encodeURIComponent(month)}`)
}
