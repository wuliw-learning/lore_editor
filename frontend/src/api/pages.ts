import type { Block, Page, PageDetail, SearchResult, UploadedFile } from '../types'
import { api } from './client'

export type AppInfo = {
  name: string
  version: string
  description: string
  max_upload_size_mb: number
  username: string
}

export function getAppInfo() {
  return api<AppInfo>('/api/app/info')
}

export function listPages() {
  return api<Page[]>('/api/pages')
}

export function createPage(title: string, parent_id: number | null = null) {
  return api<PageDetail>('/api/pages', {
    method: 'POST',
    body: JSON.stringify({ title, parent_id }),
  })
}

export function getPage(pageId: number) {
  return api<PageDetail>(`/api/pages/${pageId}`)
}

export function updatePage(pageId: number, payload: Partial<Pick<Page, 'title' | 'is_favorite' | 'sort_order'>>) {
  return api<PageDetail>(`/api/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deletePage(pageId: number) {
  return api<{ status: string }>(`/api/pages/${pageId}`, { method: 'DELETE' })
}

export function favoritePage(pageId: number) {
  return api(`/api/pages/${pageId}/favorite`, { method: 'POST' })
}

export function unfavoritePage(pageId: number) {
  return api(`/api/pages/${pageId}/favorite`, { method: 'DELETE' })
}

export function listBlocks(pageId: number) {
  return api<Block[]>(`/api/pages/${pageId}/blocks`)
}

export function createBlock(pageId: number, payload: Partial<Block>) {
  return api<Block>(`/api/pages/${pageId}/blocks`, {
    method: 'POST',
    body: JSON.stringify({
      type: payload.type ?? 'text',
      content: payload.content ?? '',
      metadata: payload.metadata ?? {},
      sort_order: payload.sort_order ?? 0,
    }),
  })
}

export function updateBlock(blockId: number, payload: Partial<Block>) {
  return api<Block>(`/api/blocks/${blockId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteBlockApi(blockId: number) {
  return api<{ status: string }>(`/api/blocks/${blockId}`, { method: 'DELETE' })
}

export function reorderBlocks(pageId: number, items: Array<{ id: number; sort_order: number }>) {
  return api<{ status: string }>(`/api/pages/${pageId}/blocks/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  })
}

export function search(query: string) {
  return api<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`)
}

export function listFiles() {
  return api<UploadedFile[]>('/api/files')
}

export async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/files', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.detail ?? 'Upload failed')
  }
  return response.json() as Promise<UploadedFile>
}

export function getFileContentUrl(fileId: number) {
  return `/api/files/${fileId}`
}

export function deleteFile(fileId: number) {
  return api<{ status: string }>(`/api/files/${fileId}`, { method: 'DELETE' })
}
