import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { Page, User } from '../types'
import { Button } from './Button'

type Props = {
  pages: Page[]
  user: User
  appStatus: string
  onCreatePage: () => void
  onOpenSearch: () => void
  onOpenHotkeys: () => void
  onLogout: () => void
}

export function AppShell({ pages, user, appStatus, onCreatePage, onOpenSearch, onOpenHotkeys, onLogout }: Props) {
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
          <div>
            <div className="eyebrow">Personal wiki</div>
            <h1>Lore</h1>
          </div>
        </div>
        <div className="sidebar-actions">
          <Button className="sidebar-nav-button" onClick={onOpenSearch}>Search</Button>
          <Button className="sidebar-nav-button" onClick={() => navigate('/files')}>Files</Button>
          <Button className="sidebar-nav-button" onClick={() => navigate('/settings')}>Settings</Button>
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
          <div className="muted small">Signed in as {user.username}</div>
          <div className="footer-actions">
            <Button className="sidebar-footer-button" onClick={onOpenHotkeys}>Hotkeys</Button>
            <Button className="sidebar-footer-button" variant="danger" onClick={onLogout}>
              Logout
            </Button>
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
            <Button className="search-compact" onClick={onOpenSearch}>
              Search
            </Button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
