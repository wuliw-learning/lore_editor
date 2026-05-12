import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { Page, User } from '../types'
import { Button } from './Button'

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.4 10.4L14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function FilesIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 4.5h4l1.2 1.6h5.8v5.6a1.3 1.3 0 0 1-1.3 1.3H3.8a1.3 1.3 0 0 1-1.3-1.3z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M2.5 6.1V4.3A1.3 1.3 0 0 1 3.8 3h2.6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2.7l1 .4.8-.6 1.3 1.3-.6.8.4 1 .9.2v1.8l-.9.2-.4 1 .6.8-1.3 1.3-.8-.6-1 .4-.2.9H7l-.2-.9-1-.4-.8.6-1.3-1.3.6-.8-.4-1-.9-.2V6l.9-.2.4-1-.6-.8L5 2.7l.8.6 1-.4.2-.9h1.8z" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

type Props = {
  pages: Page[]
  user: User
  appStatus: string
  onCreatePage: () => void
  onOpenSearch: () => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onLogout: () => void
}

export function AppShell({ pages, user, appStatus, onCreatePage, onOpenSearch, searchQuery, onSearchQueryChange, onLogout }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const favorites = pages.filter((page) => page.is_favorite)
  const roots = pages.filter((page) => page.parent_id === null)

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="app-layout">
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-block">
            <div className="eyebrow">Personal wiki</div>
            <h1>Lore</h1>
          </div>
        </div>
        <div className="sidebar-actions">
          <Button className="sidebar-nav-button sidebar-link-button" onClick={onOpenSearch}><span className="sidebar-link-icon"><SearchIcon /></span><span>Search</span></Button>
          <Button className="sidebar-nav-button sidebar-link-button" onClick={() => navigate('/files')}><span className="sidebar-link-icon"><FilesIcon /></span><span>Files</span></Button>
          <Button className="sidebar-nav-button sidebar-link-button" onClick={() => navigate('/settings')}><span className="sidebar-link-icon"><SettingsIcon /></span><span>Settings</span></Button>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="section-title">Favorites</div>
            {favorites.length === 0 ? <div className="muted small">No favorites yet</div> : null}
            {favorites.map((page) => (
              <NavLink key={`favorite-${page.id}`} to={`/pages/${page.id}`} className={({ isActive }) => `nav-item nav-page-item${isActive ? ' active' : ''}`}>
                {page.title}
              </NavLink>
            ))}
          </div>
          <div className="sidebar-section">
            <div className="section-header-row">
              <div className="section-title">Pages</div>
              <Button className="sidebar-inline-create" onClick={onCreatePage}>
                + New
              </Button>
            </div>
            {roots.length === 0 ? <div className="muted small">Create your first page</div> : null}
            {roots.map((page) => (
              <NavLink key={page.id} to={`/pages/${page.id}`} className={({ isActive }) => `nav-item nav-page-item${isActive ? ' active' : ''}`}>
                {page.title}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-account-card">
            <div className="muted small">Signed in as</div>
            <div className="sidebar-account-row">
              <strong>{user.username}</strong>
              <Button className="sidebar-account-logout" variant="danger" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </aside>
      {sidebarOpen ? <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" /> : null}
      <main className="content-area">
        <div className="content-topbar">
          <div className="content-topbar-left">
            <Button className="menu-toggle" onClick={() => setSidebarOpen((current) => !current)}>
              Menu
            </Button>
            <button className="lore-mark" onClick={() => navigate('/')}>
              Lore
            </button>
          </div>
          <div className="content-topbar-right">
            <button className={`status-chip${appStatus ? ' visible' : ''}`} aria-live="polite">
              {appStatus || 'Autosave on'}
            </button>
            <label className="topbar-search" aria-label="Search pages and blocks">
              <span className="topbar-search-icon"><SearchIcon /></span>
              <input
                className="topbar-search-input"
                placeholder="Search pages and blocks"
                value={searchQuery}
                onFocus={onOpenSearch}
                onChange={(event) => {
                  onSearchQueryChange(event.target.value)
                  if (!searchQuery) {
                    onOpenSearch()
                  }
                }}
              />
            </label>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
