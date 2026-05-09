import { useState, type FormEvent } from 'react'

import { login } from '../api/auth'
import { Button } from './Button'

type Props = {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: Props) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(username, password)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-header">
          <div className="eyebrow">Self-hosted notebook</div>
          <h1>Lore</h1>
          <p className="muted">Sign in to access pages, files, and settings.</p>
        </div>
        <div className="login-fields">
          <label className="field-group">
            <span className="field-label">Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label className="field-group">
            <span className="field-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
        </div>
        {error ? <div className="error-box">{error}</div> : null}
        <Button type="submit" variant="primary" className="login-submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
