import type { User } from '../types'
import { Button } from '../components/Button'

type Props = {
  user: User
  maxUploadSizeMb: number
  appName: string
  version: string
  description: string
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenHotkeys: () => void
  onLogout: () => void
}

export function SettingsPage({ user, maxUploadSizeMb, appName, version, description, theme, onToggleTheme, onOpenHotkeys, onLogout }: Props) {
  return (
    <div className="section-page">
      <div className="section-header">
        <div>
          <h2>Settings</h2>
          <p className="muted">Lore is a compact self-hosted notebook for a single user.</p>
        </div>
      </div>
      <div className="settings-grid">
        <div className="settings-card">
          <h3>Application</h3>
          <p>Name: {appName}</p>
          <p>Version: {version}</p>
          <p>{description}</p>
          <p>User: {user.username}</p>
          <p>Upload limit: {maxUploadSizeMb} MB</p>
        </div>
        <div className="settings-card">
          <h3>Appearance</h3>
          <p>Current theme: {theme === 'dark' ? 'Dark' : 'Light'}</p>
          <p>Switch the workspace between low-glare dark mode and a lighter reading surface.</p>
          <Button onClick={onToggleTheme}>{theme === 'dark' ? 'Use light theme' : 'Use dark theme'}</Button>
        </div>
        <div className="settings-card">
          <h3>Keyboard shortcuts</h3>
          <p>Open the built-in hotkeys help for the full list.</p>
          <Button onClick={onOpenHotkeys}>Show shortcuts</Button>
        </div>
        <div className="settings-card">
          <h3>Session</h3>
          <p>Authentication is protected by an HttpOnly cookie backed by a JWT.</p>
          <Button variant="danger" onClick={onLogout}>Logout</Button>
        </div>
      </div>
    </div>
  )
}
