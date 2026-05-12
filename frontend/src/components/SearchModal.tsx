import { useEffect, useMemo, useState } from 'react'

import { search } from '../api/pages'
import type { SearchResult } from '../types'

type Props = {
  query: string
  onQueryChange: (value: string) => void
  onSelect: (pageId: number) => void
}

export function SearchModal({ query, onQueryChange, onSelect }: Props) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const summary = useMemo(() => (query.trim() ? `${results.length} matches` : 'Type to search titles and blocks'), [query, results.length])

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!query.trim()) {
        setResults([])
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setResults(await search(query.trim()))
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 180)

    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, results.length])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' && results.length > 0) {
        event.preventDefault()
        setActiveIndex((current) => (current + 1) % results.length)
      }
      if (event.key === 'ArrowUp' && results.length > 0) {
        event.preventDefault()
        setActiveIndex((current) => (current - 1 + results.length) % results.length)
      }
      if (event.key === 'Enter' && results[activeIndex]) {
        event.preventDefault()
        onSelect(results[activeIndex].page_id)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, onSelect, results])

  return (
    <div className="search-panel" role="listbox" aria-label="Search results">
      <div className="search-panel-header">
        <div className="search-summary muted small">{loading ? 'Searching...' : summary}</div>
        {query ? (
          <button className="search-clear-button" onClick={() => onQueryChange('')}>
            Clear
          </button>
        ) : null}
      </div>
      <div className="search-results">
        {!loading && results.length === 0 ? <p className="muted">Exact matches will appear here.</p> : null}
        {results.map((result, index) => (
          <button
            key={`${result.page_id}-${result.match_type}-${result.snippet}`}
            className={`search-result${index === activeIndex ? ' active' : ''}`}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => onSelect(result.page_id)}
          >
            <strong>{result.page_title}</strong>
            <span>{result.match_type === 'title' ? 'Title match' : result.snippet}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
