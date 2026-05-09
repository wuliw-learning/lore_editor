import type { User } from '../types'
import { Button } from '../components/Button'

type Props = {
  user: User
  maxUploadSizeMb: number
  appName: string
  version: string
  description: string
  onOpenHotkeys: () => void
  onLogout: () => void
}

export function SettingsPage({ user, maxUploadSizeMb, appName, version, description, onOpenHotkeys, onLogout }: Props) {
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
