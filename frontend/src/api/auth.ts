import { api } from './client'
import type { User } from '../types'

export function login(username: string, password: string) {
  return api<User>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function logout() {
  return api<{ status: string }>('/api/auth/logout', { method: 'POST' })
}

export function me() {
  return api<User>('/api/auth/me')
}
