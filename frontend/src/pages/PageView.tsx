import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { deletePage, favoritePage, getPage, unfavoritePage, updatePage } from '../api/pages'
import { Button } from '../components/Button'
import { BlockEditor } from '../editor/BlockEditor'
import type { Page, PageDetail } from '../types'

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
  const parentPageId = pages.find((candidate) => candidate.id === pageId)?.parent_id ?? null

  const refresh = async () => {
    try {
      const data = await getPage(pageId)
      setPage(data)
      setTitle(data.title)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load page')
    }
  }

  useEffect(() => {
    if (!Number.isNaN(pageId)) {
      void refresh()
    }
  }, [pageId])

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!page || title === page.title) return
      try {
        const updated = await updatePage(page.id, { title })
        setPage(updated)
        setStatus('Saved')
        await onRefreshPages()
      } catch {
        setStatus('Save failed')
      }
    }, 400)

    return () => window.clearTimeout(timer)
  }, [title, page, onRefreshPages])

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

  return (
    <div className="page-view">
      <div className="breadcrumbs">
        {page.breadcrumbs.map((item, index) => (
          <span key={item.id}>
            {index > 0 ? ' / ' : ''}
            <Link to={`/pages/${item.id}`}>{item.title}</Link>
          </span>
        ))}
      </div>
      <div className="page-toolbar">
        <input className="page-title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled" />
        <div className="page-toolbar-actions">
          <span className="page-status muted small">{status || 'Autosave'}</span>
          <div className="toolbar-actions">
            <Button className="page-action-button" onClick={async () => {
              if (page.is_favorite) {
                await unfavoritePage(page.id)
              } else {
                await favoritePage(page.id)
              }
              await refresh()
              await onRefreshPages()
            }}>{page.is_favorite ? 'Unfavorite' : 'Favorite'}</Button>
            <Button className="page-action-button" variant="danger" onClick={async () => {
              try {
                await deletePage(page.id)
                await onRefreshPages()
                navigate('/')
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Delete failed')
              }
            }}>Delete</Button>
          </div>
        </div>
      </div>
      <BlockEditor pageId={page.id} pages={pages} onRefreshPages={onRefreshPages} onSavingState={setStatus} />
    </div>
  )
}
