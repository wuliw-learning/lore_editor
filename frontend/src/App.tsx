import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import { logout, me } from './api/auth'
import { createPage, getAppInfo, listPages } from './api/pages'
import { AppShell } from './components/AppShell'
import { HotkeysModal } from './components/HotkeysModal'
import { LoginForm } from './components/LoginForm'
import { SearchModal } from './components/SearchModal'
import { useHotkeys } from './hooks/useHotkeys'
import { FilesPage } from './pages/FilesPage'
import { PageView } from './pages/PageView'
import { SettingsPage } from './pages/SettingsPage'
import { WelcomePage } from './pages/WelcomePage'
import type { Page, User } from './types'

type AppInfoState = {
  name: string
  version: string
  description: string
  max_upload_size_mb: number
}

type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'lore-theme'

function readInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return storedTheme === 'light' ? 'light' : 'dark'
}

function App() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [pages, setPages] = useState<Page[]>([])
  const [appInfo, setAppInfo] = useState<AppInfoState>({
    name: 'Lore',
    version: '1.0.0',
    description: 'Compact self-hosted notebook for one user.',
    max_upload_size_mb: 20,
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hotkeysOpen, setHotkeysOpen] = useState(false)
  const [appStatus, setAppStatus] = useState('')
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (!appStatus) return
    const timer = window.setTimeout(() => setAppStatus(''), 1600)
    return () => window.clearTimeout(timer)
  }, [appStatus])

  const refreshPages = useCallback(async () => {
    setPages(await listPages())
  }, [])

  const loadSession = useCallback(async () => {
    setLoading(true)
    try {
      setUser(await me())
      setAppInfo(await getAppInfo())
      await refreshPages()
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [refreshPages])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  const handleCreatePage = useCallback(async () => {
    const page = await createPage('Untitled')
    await refreshPages()
    navigate(`/pages/${page.id}`)
  }, [navigate, refreshPages])

  const handleLogout = useCallback(async () => {
    await logout()
    setUser(null)
    navigate('/login')
  }, [navigate])

  const handleToggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  useHotkeys(
    useMemo(
      () => [
        { combo: 'ctrl+k', handler: () => setSearchOpen(true) },
        { combo: 'ctrl+n', handler: () => void handleCreatePage() },
        { combo: 'ctrl+s', handler: () => setAppStatus('Saved') },
        { combo: 'ctrl+/', handler: () => setHotkeysOpen(true) },
        { combo: 'meta+k', handler: () => setSearchOpen(true) },
        { combo: 'meta+n', handler: () => void handleCreatePage() },
        { combo: 'meta+s', handler: () => setAppStatus('Saved') },
      ],
      [handleCreatePage],
    ),
  )

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setHotkeysOpen(false)
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  if (loading) {
    return <div className="screen-center">Loading Lore...</div>
  }

  if (!user) {
    return <LoginForm onSuccess={() => void loadSession()} />
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <AppShell
              pages={pages}
              user={user}
              appStatus={appStatus}
              onCreatePage={() => void handleCreatePage()}
              onOpenSearch={() => setSearchOpen(true)}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onLogout={() => void handleLogout()}
            />
          }
        >
          <Route index element={<WelcomePage />} />
          <Route path="pages/:pageId" element={<PageView pages={pages} onRefreshPages={refreshPages} />} />
          <Route path="files" element={<FilesPage maxUploadSizeMb={appInfo.max_upload_size_mb} />} />
          <Route
            path="settings"
            element={<SettingsPage user={user} maxUploadSizeMb={appInfo.max_upload_size_mb} appName={appInfo.name} version={appInfo.version} description={appInfo.description} theme={theme} onToggleTheme={handleToggleTheme} onOpenHotkeys={() => setHotkeysOpen(true)} onLogout={() => void handleLogout()} />}
          />
        </Route>
        <Route path="/login" element={<Navigate to="/" replace />} />
      </Routes>
      {searchOpen ? (
        <SearchModal
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onClose={() => setSearchOpen(false)}
          onSelect={(pageId) => {
            setSearchOpen(false)
            navigate(`/pages/${pageId}`)
          }}
        />
      ) : null}
      {hotkeysOpen ? <HotkeysModal onClose={() => setHotkeysOpen(false)} /> : null}
    </>
  )
}

export default App
