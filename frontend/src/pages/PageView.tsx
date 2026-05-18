import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { deletePage, favoritePage, getPage, unfavoritePage, updatePage } from '../api/pages'
import { Button } from '../components/Button'
import { BlockEditor } from '../editor/BlockEditor'
import { FORCE_SAVE_EVENT } from '../saveEvents'
import type { Page, PageDetail } from '../types'

function getTitleLengthClass(value: string) {
  const length = value.trim().length
  if (length >= 72) return 'title-length-xlong'
  if (length >= 48) return 'title-length-long'
  if (length >= 28) return 'title-length-medium'
  return 'title-length-short'
}

function SaveIcon({ state }: { state: string }) {
  if (state === 'Save failed') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 2.7l5.3 9.1H2.7L8 2.7z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M8 6v2.8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="11.1" r="0.7" fill="currentColor" />
      </svg>
    )
  }

  if (state === 'Saved') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="5.3" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5.4 8.1l1.7 1.7 3.5-3.8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2.7a5.3 5.3 0 1 1-4.9 3.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 1.8v2.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function FavoriteIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2.2l1.8 3.7 4.1.6-3 2.9.7 4.1L8 11.6l-3.6 1.9.7-4.1-3-2.9 4.1-.6L8 2.2z" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.7 4.5h8.6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6 4.5V3.4c0-.5.4-.9.9-.9h2.2c.5 0 .9.4.9.9v1.1" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.1 4.5l.5 7.2c0 .5.4.8.9.8h3c.5 0 .9-.4.9-.8l.5-7.2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6.9 6.4v4.2M9.1 6.4v4.2" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

type Props = {
  pages: Page[]
  onRefreshPages: () => Promise<void>
}

export function PageView({ pages, onRefreshPages }: Props) {
  const params = useParams()
  const navigate = useNavigate()
  const pageId = Number(params.pageId)
  const [page, setPage] = useState<PageDetail | null>(null)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const titleRef = useRef('')
  const parentPageId = pages.find((candidate) => candidate.id === pageId)?.parent_id ?? null

  titleRef.current = title

  const refresh = async () => {
    try {
      const data = await getPage(pageId)
      setPage(data)
      setTitle(data.title)
      titleRef.current = data.title
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load page')
    }
  }

  const saveTitle = async () => {
    if (!page || titleRef.current === page.title) return

    setStatus('Saving...')
    try {
      const updated = await updatePage(page.id, { title: titleRef.current })
      setPage((current) => (current && current.id === updated.id ? updated : current))
      setStatus(titleRef.current === updated.title ? 'Saved' : 'Saving...')
      await onRefreshPages()
    } catch {
      setStatus('Save failed')
    }
  }

  useEffect(() => {
    if (!Number.isNaN(pageId)) {
      void refresh()
    }
  }, [pageId])

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      await saveTitle()
    }, 400)

    return () => window.clearTimeout(timer)
  }, [title, page])

  useEffect(() => {
    const listener = () => {
      void saveTitle()
    }

    window.addEventListener(FORCE_SAVE_EVENT, listener)
    return () => window.removeEventListener(FORCE_SAVE_EVENT, listener)
  }, [page, title])

  if (error) {
    return (
      <div className="page-state page-missing-state">
        <div className="error-box page-missing-card">
          <h2>Page not found</h2>
          <p className="muted">This page may have been deleted. You can return to your workspace or go back to the parent page.</p>
          <div className="page-missing-actions">
            {parentPageId ? <Button onClick={() => navigate(`/pages/${parentPageId}`)}>Open parent</Button> : null}
            <Button onClick={() => navigate('/')}>Go home</Button>
          </div>
        </div>
      </div>
    )
  }
  if (!page) return <div className="page-state">Loading page...</div>

  const saveLabel = status || 'Autosave'
  const titleLengthClass = getTitleLengthClass(title || page.title)

  return (
    <div className="page-view">
      <div className="page-floating-actions">
        <div className="page-header-actions">
          <button className={`page-save-indicator${status === 'Saving...' ? ' is-saving' : ''}${status === 'Saved' ? ' is-saved' : ''}${status === 'Save failed' ? ' is-failed' : ''}`} aria-label={saveLabel} title={saveLabel}>
            <SaveIcon state={saveLabel} />
          </button>
          <button className={`page-icon-action${page.is_favorite ? ' is-active' : ''}`} aria-label={page.is_favorite ? 'Unfavorite page' : 'Favorite page'} title={page.is_favorite ? 'Unfavorite page' : 'Favorite page'} onClick={async () => {
            if (page.is_favorite) {
              await unfavoritePage(page.id)
            } else {
              await favoritePage(page.id)
            }
            await refresh()
            await onRefreshPages()
          }}>
            <FavoriteIcon filled={page.is_favorite} />
          </button>
          <button className="page-icon-action page-icon-action-danger" aria-label="Delete page" title="Delete page" onClick={async () => {
            try {
              await deletePage(page.id)
              await onRefreshPages()
              navigate('/')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Delete failed')
            }
          }}>
            <DeleteIcon />
          </button>
        </div>
      </div>
      <div className="breadcrumbs">
        {page.breadcrumbs.map((item, index) => (
          <span key={item.id}>
            {index > 0 ? ' / ' : ''}
            <Link to={`/pages/${item.id}`}>{item.title}</Link>
          </span>
        ))}
      </div>
      <div className="page-toolbar">
        <div className="page-heading-block">
          <div className="page-kicker muted small">Document</div>
          <input className={`page-title-input ${titleLengthClass}`.trim()} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled" />
        </div>
      </div>
      <BlockEditor pageId={page.id} pages={pages} onRefreshPages={onRefreshPages} onSavingState={setStatus} />
    </div>
  )
}
